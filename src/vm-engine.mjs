const DEFAULT_TIME = "2026-04-28T00:00:00.000Z";

export const SEEDED_VMS = [
  createVm({
    name: "Debian XFCE",
    memoryMB: 2048,
    cpuThreads: 4,
    renderer: "webgpu",
    networkMode: "proxy",
    firmwareType: "modified-ovmf",
    display: { width: 1280, height: 720 },
    profile: "balanced",
    storageGB: 24,
  }),
  createVm({
    name: "Alpine CLI",
    memoryMB: 512,
    cpuThreads: 2,
    renderer: "canvas",
    networkMode: "offline",
    firmwareType: "direct-kernel",
    display: { width: 960, height: 540 },
    profile: "low-end",
    storageGB: 4,
  }),
  createVm({
    name: "Arch Lab",
    memoryMB: 4096,
    cpuThreads: 6,
    renderer: "webgl",
    networkMode: "p2p",
    firmwareType: "limine",
    display: { width: 1440, height: 900 },
    profile: "high-performance",
    storageGB: 48,
  }),
];

export function createVm(config = {}) {
  const now = config.createdAt ?? DEFAULT_TIME;
  const name = config.name ?? "Untitled VM";

  return {
    id: config.id ?? stableId(name, now),
    name,
    architecture: config.architecture ?? "x86_64",
    memoryMB: config.memoryMB ?? 2048,
    cpuThreads: config.cpuThreads ?? 4,
    renderer: config.renderer ?? "webgpu",
    networkMode: config.networkMode ?? "proxy",
    storage: {
      backend: config.storageBackend ?? "local",
      copyOnWrite: config.copyOnWrite ?? true,
      sizeGB: config.storageGB ?? 16,
    },
    firmware: {
      type: config.firmwareType ?? "direct-kernel",
    },
    display: config.display ?? { width: 1280, height: 720 },
    profile: config.profile ?? "balanced",
    status: config.status ?? "stopped",
    snapshots: config.snapshots ?? [],
    createdAt: now,
    updatedAt: now,
    activityLog: config.activityLog ?? [
      {
        at: now,
        message: "VM definition created",
      },
    ],
    lastError: "",
  };
}

export function startVm(vm, at = timestamp()) {
  if (!["stopped", "paused", "error"].includes(vm.status)) {
    return invalid(vm, `Cannot start while ${vm.status}`);
  }

  return transition(vm, "booting", "Power on requested", at);
}

export function markVmRunning(vm, at = timestamp()) {
  if (vm.status !== "booting") {
    return invalid(vm, `Cannot finish boot while ${vm.status}`);
  }

  return transition(vm, "running", "Guest display attached", at);
}

export function pauseVm(vm, at = timestamp()) {
  if (vm.status !== "running") {
    return invalid(vm, `Cannot pause while ${vm.status}`);
  }

  return transition(vm, "paused", "Execution paused", at);
}

export function resumeVm(vm, at = timestamp()) {
  if (vm.status !== "paused") {
    return invalid(vm, `Cannot resume while ${vm.status}`);
  }

  return transition(vm, "running", "Execution resumed", at);
}

export function stopVm(vm, at = timestamp()) {
  if (!["booting", "running", "paused", "error"].includes(vm.status)) {
    return invalid(vm, `Cannot stop while ${vm.status}`);
  }

  return transition(vm, "stopped", "Power off completed", at);
}

export function resetVm(vm, at = timestamp()) {
  if (!["booting", "running", "paused", "error"].includes(vm.status)) {
    return invalid(vm, `Cannot reset while ${vm.status}`);
  }

  return transition(vm, "booting", "Reset requested", at);
}

export function createSnapshot(vm, name = "Manual snapshot", at = timestamp()) {
  if (!["running", "paused"].includes(vm.status)) {
    return invalid(vm, `Cannot snapshot while ${vm.status}`);
  }

  const snapshot = {
    id: stableId(`${vm.id}-${name}`, at),
    name,
    createdAt: at,
    status: vm.status,
  };

  return {
    ...vm,
    snapshots: [snapshot, ...vm.snapshots],
    updatedAt: at,
    activityLog: prependActivity(vm, `Snapshot created: ${name}`, at),
    lastError: "",
  };
}

export function cloneVm(vm, name = `${vm.name} Clone`, at = timestamp()) {
  return {
    ...vm,
    id: stableId(name, at),
    name,
    status: "stopped",
    snapshots: [],
    createdAt: at,
    updatedAt: at,
    activityLog: [{ at, message: `Cloned from ${vm.name}` }],
    lastError: "",
  };
}

export function classifyHardwareProfile(capabilities = {}) {
  const cpuThreads = capabilities.cpuThreads ?? 4;
  const memoryGB = capabilities.memoryGB ?? 8;
  const webgpu = capabilities.webgpu ?? false;

  if (cpuThreads <= 2 || memoryGB <= 2) {
    return "low-end";
  }

  if (cpuThreads >= 12 && memoryGB >= 12 && webgpu) {
    return "high-performance";
  }

  return "balanced";
}

export function summarizeCapabilities(capabilities = {}) {
  const normalized = {
    cpuThreads: capabilities.cpuThreads ?? null,
    memoryGB: capabilities.memoryGB ?? null,
    webgpu: Boolean(capabilities.webgpu),
    webgl: Boolean(capabilities.webgl),
    opfs: Boolean(capabilities.opfs),
    persistentStorage: Boolean(capabilities.persistentStorage),
  };

  return {
    ...normalized,
    profile: classifyHardwareProfile(normalized),
  };
}

function transition(vm, status, message, at) {
  return {
    ...vm,
    status,
    updatedAt: at,
    activityLog: prependActivity(vm, message, at),
    lastError: "",
  };
}

function invalid(vm, message) {
  return {
    ...vm,
    lastError: message,
  };
}

function prependActivity(vm, message, at) {
  return [{ at, message }, ...vm.activityLog].slice(0, 12);
}

function stableId(value, salt = DEFAULT_TIME) {
  const normalized = `${value}-${salt}`.toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return `vm-${hash.toString(16).padStart(8, "0")}`;
}

function timestamp() {
  return new Date().toISOString();
}
