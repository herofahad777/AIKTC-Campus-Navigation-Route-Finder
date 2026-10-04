# Campus Navigation 3D Coordinate System Specification

This document defines the 3D coordinate conventions utilized across the Campus Navigation Route Finder 3D Graph Viewer.

## 1. Axis Definitions

The campus coordinate space follows a right-handed Cartesian coordinate system adapted for spatial campus mapping:

| Axis | Spatial Orientation | Cardinal Direction | Description |
|:---:|:---:|:---:|:---|
| **X** | Horizontal Lateral | **East (+) / West (-)** | Positive $X$ extends towards East; Negative $X$ extends towards West. |
| **Y** | Vertical | **Elevation (+) / Depth (-)** | Positive $Y$ represents height above ground level (e.g. building floors, hill elevation). $Y = 0$ is ground level. |
| **Z** | Horizontal Longitudinal | **North (-) / South (+)** | Positive $Z$ extends towards South; Negative $Z$ extends towards North (standard Three.js convention where $-Z$ points forward/North). |

```
                       +Y (Elevation / Height)
                          ^
                          |
                          |   -Z (North)
                          |  /
                          | /
                          |/
    -X (West) <-----------+-----------> +X (East)
                         /|
                        / |
                       /  |
            +Z (South)    v
```

## 2. Cardinal Compass & Plane Projection

Viewing from above (Top-Down Plane: $X-Z$ plane at $Y = 0$):

```
                   North (-Z)
                       ^
                       |
       West (-X) <-----+-----> East (+X)
                       |
                       v
                   South (+Z)
```

- Moving **North**: Decrease $Z$ (e.g., $Z = -20$)
- Moving **South**: Increase $Z$ (e.g., $Z = +20$)
- Moving **East**: Increase $X$ (e.g., $X = +30$)
- Moving **West**: Decrease $X$ (e.g., $X = -30$)
- Moving **Upward** (Higher floor/hill): Increase $Y$ (e.g., $Y = 4$)

## 3. Concrete Campus Coordinate Examples

| Location | ID | $X$ (East/West) | $Y$ (Elevation) | $Z$ (North/South) | Context Description |
|:---|:---|:---:|:---:|:---:|:---|
| **Main Gate** | `main_gate` | `0` | `0` | `25` | Southern entrance on ground level |
| **Administrative Building** | `admin_block` | `0` | `0` | `10` | Central campus administrative hub |
| **Central Library** | `library` | `-15` | `1` | `-5` | Western sector on a gentle 1m rise |
| **Computer Science Dept** | `cs_dept` | `18` | `0` | `-12` | Eastern tech quadrant |
| **Science Complex** | `science_block` | `-20` | `0` | `-25` | Northwestern academic quadrant |
| **Cafeteria** | `cafeteria` | `5` | `0` | `-2` | Central dining hub |
| **Student Center (Floor 2)** | `student_center_f2` | `-5` | `4` | `8` | Elevated hub above walkway |
| **Sports Arena** | `sports_arena` | `28` | `0` | `15` | Southeastern athletic grounds |

## 4. Visual Alignment & Placement Verification

In Debug Placement Mode:
- **Reference Grid**: Lays flat on the $X-Z$ plane ($Y = 0$) with grid spacing of 5 units.
- **Axes Helper**:
  - **Red line**: $+X$ (East)
  - **Green line**: $+Y$ (Elevation)
  - **Blue line**: $+Z$ (South)
- **Drop Stems**: Nodes with $Y > 0$ render a vertical stem down to the ground plane ($Y = 0$) with a footprint ring to give clear spatial depth perception.
