# Electric Circuit Lab 3D SCORM

This package is a standalone SCORM 1.2 learning game built with plain Three.js.

## Learning goal

Learners practice the logic of a simple electric circuit by:

- placing the correct components in the correct sockets
- rotating each component so it follows the wire path
- closing the switch
- clicking diagnostic probes to verify current flow

## Interactions included

- dragging
- rotating
- clicking
- scoreboard and timer
- SCORM score and completion reporting

## Local preview

```powershell
cd C:\Users\jewoo\Documents\Playground\electric-circuit-lab-scorm
python -m http.server 8095
```

Then open `http://localhost:8095`.

## SCORM package

The deliverable zip is intended to be:

- `electric-circuit-lab-scorm-package.zip`

## Completion logic

- learners place and align all four components
- learners click the switch to close the circuit
- learners activate all three diagnostic probes to reach full current
- the SCO reports score and lesson status to the LMS
