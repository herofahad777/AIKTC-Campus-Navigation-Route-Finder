/* ============================================================================
 * CAMPUS NAVIGATION ROUTE FINDER - C ENGINE CORE
 * File: engine/routefinder.c
 *
 * NOTICE:
 * This file is intentionally left for manual implementation.
 * DO NOT GENERATE CODE, STUBS, OR ALGORITHMS IN THIS FILE.
 *
 * The C Graph/BFS implementation is intentionally excluded from automated
 * tooling and will be manually implemented by the project owner as part of
 * the core Data Structures assignment.
 * ============================================================================
 *
 * FUTURE RESPONSIBILITIES FOR MANUAL IMPLEMENTATION:
 *
 * 1. Graph Data Structure
 *    - Memory-efficient representation (e.g., Adjacency List using dynamically
 *      allocated linked lists or adjacency array of pointers).
 *    - Node lookup hash table or indexed array mapped from node IDs.
 *    - Bidirectional edge storage or directed campus pathways.
 *
 * 2. Queue Data Structure
 *    - First-In-First-Out (FIFO) queue for graph traversal.
 *    - Enqueue, dequeue, isEmpty, and queue reset functions.
 *    - Capacity management (circular array or linked node queue).
 *
 * 3. Breadth-First Search (BFS) Traversal
 *    - Unweighted shortest-path exploration between start and target campus nodes.
 *    - Visited array / bitmask tracking.
 *    - Parent tracking array for reconstructive backtrack of the route.
 *
 * 4. JSON / Data Ingestion
 *    - Parsing nodes and edges from exported JSON or custom serialized campus map format.
 *    - Coordinate ingestion for spatial distance attribution if needed.
 *
 * 5. Route Computation & Output
 *    - End-to-end path reconstruction from target to source via parent array.
 *    - Path formatting (sequence of node IDs and hop count).
 *
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_NODES 1000
#define MAX_EDGES 3000
#define MAX_NAME 640
#define NODES_FILE "../data/nodes.json"
#define EDGES_FILE "../data/edges.json"
#define REQUEST_FILE "route_request.json"
#define RESULT_FILE "route_result.json"

struct Node {
    char id[MAX_NAME];
};

struct Edge {
    int from;
    int to;
};

struct AdjList {
    int neighbours[MAX_NODES];
    int count;
};

struct Queue {
    int items[MAX_NODES];
    int front;
    int rear;
};

// Global Variables

struct Node nodes[MAX_NODES];
struct Edge edges[MAX_EDGES];
struct AdjList graph[MAX_NODES];

int nodeCount = 0;
int edgeCount = 0;

// Queue Functions

void initQueue(struct Queue *q) {
    q->front = 0;
    q->rear = -1;
}

int isEmpty(struct Queue *q) {
    return q->rear < q->front;
}

void enqueue(struct Queue *q, int value) {
    q->items[++q->rear] = value;
}

int dequeue(struct Queue *q) {
    return q->items[q->front++];
}

// File Reader

char *readFile(const char *filename) {
    FILE *fp = fopen(filename, "rb");

    if (fp == NULL) {
        printf("Cannot open file: %s\n", filename);
        return NULL;
    }

    fseek(fp, 0, SEEK_END);
    long length = ftell(fp);
    rewind(fp);

    char *buffer = (char *)malloc(length + 1);

    fread(buffer, 1, length, fp);
    buffer[length] = '\0';

    fclose(fp);

    return buffer;
}

// Node Utilities

int getNodeIndex(const char *id) {
    int i;

    for (i = 0; i < nodeCount; i++) {
        if (strcmp(nodes[i].id, id) == 0) {
            return i;
        }
    }

    return -1;
}

// Load Nodes

void loadNodes() {
    char *text = readFile(NODES_FILE);

    if (text == NULL) {
        return;
    }

    char *ptr = text;

    while ((ptr = strstr(ptr, "\"id\"")) != NULL) {
        ptr = strchr(ptr, ':');
        ptr++;

        while (*ptr != '\"') {
            ptr++;
        }

        ptr++;

        char id[MAX_NAME];
        int i = 0;

        while (*ptr != '\"') {
            id[i++] = *ptr;
            ptr++;
        }

        id[i] = '\0';

        strcpy(nodes[nodeCount].id, id);

        nodeCount++;
    }

    free(text);
}

// Add Edge to Graph

void addEdgeToGraph(int from, int to) {
    graph[from].neighbours[graph[from].count++] = to;
    graph[to].neighbours[graph[to].count++] = from;
}

// Load Edges

void loadEdges() {
    char *text = readFile(EDGES_FILE);

    if (text == NULL) {
        return;
    }

    char *ptr = text;

    while ((ptr = strstr(ptr, "\"from\"")) != NULL) {
        char fromId[MAX_NAME];
        char toId[MAX_NAME];

        int i;

        ptr = strchr(ptr, ':');
        ptr++;

        while (*ptr != '\"') {
            ptr++;
        }

        ptr++;

        i = 0;

        while (*ptr != '\"') {
            fromId[i++] = *ptr;
            ptr++;
        }

        fromId[i] = '\0';

        ptr = strstr(ptr, "\"to\"");
        ptr = strchr(ptr, ':');
        ptr++;

        while (*ptr != '\"') {
            ptr++;
        }

        ptr++;

        i = 0;

        while (*ptr != '\"') {
            toId[i++] = *ptr;
            ptr++;
        }

        toId[i] = '\0';

        int fromIndex = getNodeIndex(fromId);
        int toIndex = getNodeIndex(toId);

        if (fromIndex >= 0 && toIndex >= 0) {
            edges[edgeCount].from = fromIndex;
            edges[edgeCount].to = toIndex;

            edgeCount++;

            addEdgeToGraph(fromIndex, toIndex);
        }
    }

    free(text);
}

// Load Route Request

void loadRequest(char source[], char destination[]) {
    char *text = readFile(REQUEST_FILE);

    if (text == NULL) {
        return;
    }

    char *ptr;
    int i;

    ptr = strstr(text, "\"source\"");
    ptr = strchr(ptr, ':');
    ptr++;

    while (*ptr != '\"') {
        ptr++;
    }

    ptr++;

    i = 0;

    while (*ptr != '\"') {
        source[i++] = *ptr;
        ptr++;
    }

    source[i] = '\0';

    ptr = strstr(text, "\"destination\"");
    ptr = strchr(ptr, ':');
    ptr++;

    while (*ptr != '\"') {
        ptr++;
    }

    ptr++;

    i = 0;

    while (*ptr != '\"') {
        destination[i++] = *ptr;
        ptr++;
    }

    destination[i] = '\0';

    free(text);
}

// BFS

int bfs(int start, int target, int parent[]) {
    int visited[MAX_NODES] = {0};

    struct Queue q;

    initQueue(&q);

    enqueue(&q, start);

    visited[start] = 1;

    parent[start] = -1;

    while (!isEmpty(&q)) {
        int current = dequeue(&q);

        if (current == target) {
            return 1;
        }

        int i;

        for (i = 0; i< graph[current].count; i++) {
            int next = graph[current].neighbours[i];

            if (!visited[next]) {
                visited[next] = 1;
                parent[next] = current;

                enqueue(&q, next);
            }
        }
    }

    return 0;
}

// Write Result

void writeResult(int found, int parent[], int target) {
    FILE *fp = fopen(RESULT_FILE, "w");

    if (fp == NULL) {
        return;
    }

    fprintf(fp, "{\n");
    fprintf(fp, " \"found\": %s,\n", found ? "true" : "false");
    fprintf(fp, " \"path\": [");

    if (found) {
        int route[MAX_EDGES];
        int count = 0;

        int current = target;

        while (current != -1) {
            route[count++] = current;
            current = parent[current];
        }

        int i;

        for (i = count - 1; i >= 0; i--) {
            fprintf(fp, "\"%s\"", nodes[route[i]].id);

            if (i > 0) {
                fprintf(fp, ",");
            }
        }
    }

    fprintf(fp, " ]\n");
    fprintf(fp, "}\n");

    fclose(fp);
}

// Debug Functions

void printNodes() {
    int i;

    printf("\nNodes:\n");

    for (i = 0; i < nodeCount; i++) {
        printf("%d -> %s\n", i, nodes[i].id);
    }
}

void printEdges() {
    int i;

    printf("\nEdges:\n");

    for (i = 0; i < edgeCount; i++) {
        printf("%s -> %s\n", nodes[edges[i].from].id,nodes[edges[i].to].id);
    }
}

// Main

int main() {
    loadNodes();

    loadEdges();

    printf("\nTotal Nodes Loaded : %d\n", nodeCount);
    printf("Total Edges Loaded : %d\n", edgeCount);

    printNodes();
    printEdges();

    char source[MAX_NAME] = "";
    char destination[MAX_NAME] = "";

    loadRequest(source, destination);

    int start = getNodeIndex(source);
    int target = getNodeIndex(destination);

    if (start == -1 || target == -1) {
        printf("Invalid source or destination\n");
        return 1;
    }

    int parent[MAX_NODES];

    int found = bfs(start, target, parent);

    writeResult(found, parent, target);

    printf("\nRoute search completed. \n");
    printf("Output written to route_result.json\n");

    return 0;
}