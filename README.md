# nulator

**Pronunciation:** "N-ulator" (like "emulator")

## Full Vision

**nulator** is a fully client-side, browser-based virtual machine platform capable of running real operating systems directly inside a web browser with no server-side VM execution.

It should feel like a **real desktop VM manager** similar to VirtualBox or VMware, not a toy emulator.

The platform aims to:

- Run real operating systems, primarily Linux, in the browser
- Support both terminal and full desktop environments, such as Debian XFCE
- Provide persistent storage using browser APIs
- Enable networking in a browser-safe way
- Use GPU acceleration for rendering and compositing
- Adapt automatically to the user's hardware
- Offer a polished, familiar VM management experience

The long-term goal is to prove that **a browser can act as a powerful local virtualization environment** without relying on cloud execution.

## Core Goals

- Fully client-side VM execution with no backend compute
- x86-64 support as a long-term target
- Linux compatibility, especially Debian, Alpine, and Arch
- Desktop environment support, with XFCE first
- Persistent local storage
- GPU-accelerated rendering
- Browser-safe networking
- Hardware-adaptive performance tuning
- Familiar VM management UI
- Modular architecture

## Technical Goals

### Execution Environment

- WebAssembly (WASM)
- Web Workers + SharedArrayBuffer + Atomics
- IndexedDB + OPFS for storage
- WebGPU as the primary renderer, with WebGL fallback
- WebRTC + WebSocket for networking
- Service Workers + Cache APIs

### Performance

- Multi-threaded execution where possible
- Instruction caching and translation
- Adaptive resource allocation
- Hardware-aware tuning
- Efficient rendering pipeline

## Recommended Languages

### TypeScript

Used for:

- UI
- VM manager
- Browser API integration
- State management
- Hardware detection

### Rust

Used for:

- CPU emulation
- Memory system
- Storage backend
- WebAssembly modules
- Performance-critical logic

### Go

Used for:

- Networking relays
- WebRTC signaling
- Dev tools and CLI
- Image/template tooling

### C / C++

Used for:

- Firmware integration
- Emulator components
- Porting existing BIOS/UEFI
- Performance-critical WASM modules

### WGSL / GLSL

Used for:

- WebGPU rendering
- WebGL fallback
- Framebuffer processing
- GPU acceleration

## UI Direction

The UI should feel like:

- VirtualBox
- VMware Workstation
- UTM
- GNOME Boxes

### Dashboard

- Sidebar with VM list
- Main panel with VM details
- Toolbar actions:
  - New
  - Import
  - Start
  - Pause
  - Reset
  - Stop
  - Clone
  - Snapshot
  - Settings
  - Delete

### VM Settings

Sections:

- General
- System
- Display
- Storage
- Audio
- Network
- Input
- Firmware
- Snapshots
- Advanced

### VM Viewer

- Canvas display
- Fullscreen
- Performance overlay
- Send key combos
- Mount images
- Debug console
- Snapshot controls

### Style

- Clean
- Desktop-like
- Functional
- Not overly flashy
- Light and dark themes

## Firmware / BIOS / Bootloader / UEFI Strategy

nulator should **reuse and adapt existing firmware** where possible.

Potential bases:

- SeaBIOS
- OVMF / EDK II
- coreboot
- GRUB
- Limine
- iPXE

### Strategy

1. Start with a custom minimal boot path
2. Add kernel/initrd direct boot
3. Adapt existing bootloaders
4. Add BIOS compatibility layer
5. Add UEFI compatibility layer
6. Support disk boot
7. Eventually support ISO boot

Goal: **practical compatibility, not perfect emulation**

## Core Systems

### CPU

- x86-64 target
- Instruction decoding
- Registers + flags
- Paging
- Interrupts
- Execution engine

Progression:

1. Fake CPU
2. Minimal VM
3. Partial x86
4. Real mode
5. Protected mode
6. Long mode

### Memory

- Virtual RAM
- Paging
- MMIO
- Snapshot support
- SharedArrayBuffer-backed memory

### Storage

- IndexedDB backend
- OPFS backend
- Chunked disks
- Copy-on-write layers
- Snapshots
- Import/export

### GPU / Display

- WebGPU renderer
- WebGL fallback
- Canvas fallback
- Framebuffer updates
- Scaling and fullscreen
- Performance overlays

### Networking

Modes:

- Offline
- Proxy
- Relay
- P2P (WebRTC)
- Port forwarding

Features:

- Virtual NIC
- DNS bridge
- HTTP proxy
- Dev server previews

### Desktop Support

Primary target:

- Debian + XFCE

Features:

- Input: keyboard, mouse, touch
- Clipboard sync
- Audio
- Resolution scaling
- Fullscreen

### Hardware Adaptation

Detect:

- CPU cores
- Memory
- WebGPU/WebGL support
- Browser type
- Storage limits

Profiles:

- Low-end
- Balanced
- High-performance
- Manual

## Architecture

```text
nulator/
├── apps/web/
├── packages/
│   ├── core/
│   ├── firmware/
│   ├── devices/
│   ├── renderer/
│   ├── storage/
│   ├── networking/
│   ├── vm-manager/
│   └── shared/
├── crates/
│   ├── cpu/
│   ├── memory/
│   ├── storage/
│   └── wasm/
├── go/
│   ├── relay/
│   ├── signaling/
│   └── tools/
├── firmware/
├── images/
├── docs/
└── README.md
```

### VM Config Example

```json
{
  "name": "Debian XFCE",
  "architecture": "x86_64",
  "memoryMB": 2048,
  "cpuThreads": 4,
  "renderer": "webgpu",
  "networkMode": "proxy",
  "storage": {
    "backend": "opfs",
    "copyOnWrite": true
  },
  "firmware": {
    "type": "modified-ovmf"
  },
  "display": {
    "width": 1280,
    "height": 720
  },
  "profile": "balanced"
}
```

## Roadmap

### Phase 0 - Planning

- Research browser limits
- Define architecture
- Define VM schema

### Phase 1 - UI MVP

- Dashboard
- VM manager UI
- Fake lifecycle

### Phase 2 - Demo VM

- Fake CPU
- Fake display
- Input + snapshots

### Phase 3 - Storage

- IndexedDB + OPFS disks
- Snapshots
- Disk import/export

### Phase 4 - Renderer

- WebGPU + WebGL
- Display pipeline

### Phase 5 - Tiny Guest

- Minimal bootable environment

### Phase 6 - Firmware

- Bootloader integration
- BIOS/UEFI adapters

### Phase 7 - CPU Core

- Instruction execution
- Debugging tools

### Phase 8 - Real Mode Boot

- Boot sector support

### Phase 9 - Protected Mode

- Paging
- Kernel loading

### Phase 10 - x86-64 Linux Boot

- Minimal Linux kernel

### Phase 11 - Terminal Linux

- Alpine/Debian CLI

### Phase 12 - Networking

- Virtual NIC
- Proxy + relay

### Phase 13 - Desktop Linux

- XFCE environment

### Phase 14 - GPU Acceleration

- 2D acceleration
- Better rendering

### Phase 15 - Optimization

- Caching
- Threading
- Profiling

### Phase 16 - Polish

- Templates
- Docs
- UX improvements

## Milestones

- VM Manager Shell
- Demo VM
- Persistent Storage
- Renderer
- Tiny Guest
- Firmware Base
- CPU Core
- Boot Support
- Linux Boot
- Terminal Linux
- Desktop Linux
- Networking + GPU + Polish

## Non-Goals

- Perfect x86 compatibility
- Windows support early on
- Full GPU passthrough
- High-end gaming
- Full UEFI spec
- All ISO support
- Cloud VM hosting

## Design Principles

- Client-side first
- Modular architecture
- Familiar VM UX
- Use the best language per system
- Reuse firmware where possible
- Build fake systems first
- Optimize known targets
- Strong debugging tools
- Respect browser limits
- Scale with hardware

## Developer Tools

- CPU trace viewer
- Register viewer
- Memory viewer
- MMIO viewer
- Device logs
- Disk inspector
- Network logs
- Frame timing graph
- Boot logs
- Snapshot diff viewer
- Performance profiler

## First MVP Scope

- VM dashboard
- VM creation
- Fake VM
- Renderer test
- Input system
- Storage prototype
- Hardware detection
- Profiles

## Success

- Create VM
- Start VM
- Fake boot works
- Input works
- Snapshot works

## Final Product Goal

nulator should be:

- Fully client-side
- Browser-based
- x86-64 capable
- Linux-capable
- Desktop-capable
- GPU-accelerated
- Network-capable
- Persistent
- Modular
- Fast enough to be useful
- Familiar to VirtualBox users
