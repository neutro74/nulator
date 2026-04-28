# nulator Balanced MVP Design

## Purpose

Build the first hosted slice of nulator as a browser-based VM manager shell that feels credible to VirtualBox, VMware, UTM, and GNOME Boxes users while laying down modular TypeScript foundations for later emulator, storage, renderer, and hardware-adaptation work.

This MVP is intentionally not a real virtual machine. It should make the product direction tangible: users can create/select demo VMs, run fake lifecycle actions, view simulated boot output, inspect configuration, create snapshots, and see browser hardware capability detection.

## Goals

- Ship a Vercel-hostable web app.
- Present a polished VM manager dashboard.
- Implement a fake VM lifecycle with predictable behavior.
- Add a simulated VM viewer with boot/display/debug surfaces.
- Persist VM definitions locally through an abstraction that can later move to IndexedDB or OPFS.
- Detect browser capabilities and classify the device into a performance profile.
- Add tests around the fake VM model, lifecycle actions, snapshots, and hardware profile classification.

## Non-Goals

- Real x86 emulation.
- Real Linux boot.
- WebGPU renderer implementation beyond feature detection and UI status.
- IndexedDB or OPFS disk implementation.
- Real networking, WebRTC, or relay services.
- ISO import support.
- User authentication or server-side VM execution.

## Recommended Implementation Shape

Use a Vercel-friendly TypeScript web app. If workspace tooling allows it cleanly, scaffold a small monorepo:

- `apps/web`: hosted UI.
- `packages/vm-manager`: VM schema, fake lifecycle reducer, snapshot helpers, seeded demo VMs.
- `packages/shared`: shared browser capability and utility types.

If initial tooling friction makes a workspace too heavy, keep the same boundaries inside `apps/web/src/lib` and `apps/web/src/features`, with code arranged so packages can be extracted later.

## Core User Flow

1. User opens the app and sees a desktop-like VM manager.
2. Sidebar lists seeded VMs, such as Debian XFCE, Alpine CLI, and Arch Lab.
3. Main panel shows selected VM status, resources, storage, network, renderer, and recent events.
4. Toolbar actions allow start, pause, reset, stop, snapshot, settings, clone, and delete where appropriate.
5. Starting a VM moves it into a simulated booting state, then running.
6. Viewer shows a canvas-like display area with fake boot logs, frame timing, and a performance overlay.
7. Snapshot creation updates metadata and recent activity.
8. Browser capability cards explain detected cores, memory, WebGPU/WebGL support, storage support, and selected profile.

## UI Design

The UI should feel like desktop infrastructure software rather than a marketing site.

Primary layout:

- Left sidebar with VM list and status dots.
- Top toolbar with VM actions.
- Main details area for the selected VM.
- Right or lower inspector area for hardware/profile/debug cards.
- Viewer route or panel for display, logs, keyboard controls, snapshots, and fullscreen affordances.

Visual direction:

- Clean, functional, dense enough to feel like real tooling.
- Light and dark theme capable.
- Strong typography and spacing, but not overly flashy.
- Subtle desktop-like surfaces, panels, dividers, and status badges.
- Avoid overpromising real virtualization in the copy.

## Domain Model

VM configuration should roughly track the README example:

- `id`
- `name`
- `architecture`
- `memoryMB`
- `cpuThreads`
- `renderer`
- `networkMode`
- `storage`
- `firmware`
- `display`
- `profile`
- `status`
- `snapshots`
- `createdAt`
- `updatedAt`
- `activityLog`

Lifecycle status:

- `stopped`
- `booting`
- `running`
- `paused`
- `stopping`
- `error`

Initial actions:

- `createVm`
- `selectVm`
- `startVm`
- `pauseVm`
- `resumeVm`
- `resetVm`
- `stopVm`
- `cloneVm`
- `deleteVm`
- `createSnapshot`

## Fake VM Engine

The fake engine should be deterministic and testable. UI timers can simulate boot progress, but state transitions should be centralized in a reducer or service layer.

Rules:

- `start` is valid from `stopped`, `paused`, or `error`.
- `pause` is valid only from `running`.
- `resume` is valid only from `paused`.
- `stop` is valid from `booting`, `running`, `paused`, or `error`.
- `reset` is valid from `booting`, `running`, `paused`, or `error`.
- `snapshot` is valid from `running` or `paused`.
- Invalid actions should not corrupt state and should return a clear error or no-op result.

## Persistence

Use a storage interface from the first implementation:

- `loadVmInventory`
- `saveVmInventory`
- `resetVmInventory`

The first adapter can use `localStorage` for speed and hosting simplicity. The interface should make IndexedDB and OPFS future adapters straightforward.

## Hardware Capability Detection

Detect capabilities when available:

- CPU thread hint from `navigator.hardwareConcurrency`.
- Memory hint from `navigator.deviceMemory` when available.
- WebGPU availability through `navigator.gpu`.
- WebGL availability through canvas context probing.
- OPFS availability through `navigator.storage.getDirectory`.
- Storage persistence support through `navigator.storage.persist`.

Classify into:

- `low-end`
- `balanced`
- `high-performance`
- `manual`

The classifier should handle missing browser APIs gracefully.

## Testing Strategy

Use test-first development for behavior code.

Required tests:

- Starting a stopped VM moves to booting/running as modeled.
- Pausing only works from running.
- Resume only works from paused.
- Stop/reset behavior is predictable across valid states.
- Snapshot creation updates snapshot metadata and activity.
- Invalid lifecycle transitions are safe.
- Hardware classifier handles low, balanced, high, and missing data cases.
- Storage adapter can round-trip VM inventory with an in-memory or fake localStorage implementation.

UI tests are optional for this first slice unless the framework makes them low-friction. Build and lint checks are required before deployment.

## Deployment

Deploy the app to Vercel after implementation verification succeeds. The repo target is `neutro74/nulator`.

Because the current local shell does not expose `git`, `gh`, or `vercel` on `PATH`, prefer the connected GitHub and Vercel app tools for repository writes and deployment where possible.

## Open Risks

- The GitHub repository is empty, while the local workspace initially contained only `README.md`; the remote must be seeded before implementation.
- Connector support may not expose every Git operation needed for branch and PR workflows, so direct file commits may be used initially.
- Vercel deployment may need project linking or framework detection after the app scaffold exists.
- A fake VM UI can accidentally imply real emulation; copy must clearly say simulated/demo where relevant.

## Approval

Approved direction: balanced hosted slice with a polished dashboard plus tested fake VM engine and storage/profile foundations.
