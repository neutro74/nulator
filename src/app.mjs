import {
  SEEDED_VMS,
  classifyHardwareProfile,
  cloneVm,
  createSnapshot,
  createVm,
  markVmRunning,
  pauseVm,
  resetVm,
  resumeVm,
  startVm,
  stopVm,
  summarizeCapabilities,
} from "./vm-engine.mjs";

const STORAGE_KEY = "nulator.vmInventory.v1";

const state = {
  vms: loadVmInventory(),
  selectedId: "",
  capabilities: summarizeCapabilities({}),
};

state.selectedId = state.vms[0]?.id ?? "";

const elements = {
  activityLog: document.querySelector("#activity-log"),
  frameRate: document.querySelector("#frame-rate"),
  hardwareMetrics: document.querySelector("#hardware-metrics"),
  hardwareProfile: document.querySelector("#hardware-profile"),
  newVmButton: document.querySelector("#new-vm-button"),
  resetInventory: document.querySelector("#reset-inventory"),
  screen: document.querySelector("#screen"),
  selectedTitle: document.querySelector("#selected-title"),
  snapshots: document.querySelector("#snapshots"),
  status: document.querySelector("#vm-status"),
  summary: document.querySelector("#vm-summary"),
  title: document.querySelector("#vm-name"),
  toolbar: document.querySelector(".toolbar"),
  viewerActions: document.querySelector(".viewer-actions"),
  vmList: document.querySelector("#vm-list"),
  vmSettings: document.querySelector("#vm-settings"),
};

detectCapabilities().then((capabilities) => {
  state.capabilities = summarizeCapabilities(capabilities);
  render();
});

elements.vmList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-vm-id]");
  if (!button) return;
  state.selectedId = button.dataset.vmId;
  render();
});

elements.toolbar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  runAction(button.dataset.action);
});

elements.viewerActions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  appendSelectedActivity(`Viewer command queued: ${button.textContent.trim()}`);
});

elements.newVmButton.addEventListener("click", () => {
  const createdAt = new Date().toISOString();
  const vm = createVm({
    name: `Lab VM ${state.vms.length + 1}`,
    createdAt,
    renderer: state.capabilities.webgpu ? "webgpu" : state.capabilities.webgl ? "webgl" : "canvas",
    profile: classifyHardwareProfile(state.capabilities),
  });
  state.vms = [vm, ...state.vms];
  state.selectedId = vm.id;
  persist();
  render();
});

elements.resetInventory.addEventListener("click", () => {
  state.vms = SEEDED_VMS.map((vm) => ({ ...vm, snapshots: [...vm.snapshots], activityLog: [...vm.activityLog] }));
  state.selectedId = state.vms[0].id;
  persist();
  render();
});

render();

function runAction(action) {
  const vm = selectedVm();
  if (!vm) return;

  const now = new Date().toISOString();
  const actions = {
    start: () => startVm(vm, now),
    pause: () => pauseVm(vm, now),
    resume: () => resumeVm(vm, now),
    reset: () => resetVm(vm, now),
    stop: () => stopVm(vm, now),
    snapshot: () => createSnapshot(vm, `Snapshot ${vm.snapshots.length + 1}`, now),
    clone: () => cloneVm(vm, `${vm.name} Copy`, now),
  };

  const next = actions[action]?.();
  if (!next) return;

  if (action === "clone") {
    state.vms = [next, ...state.vms];
    state.selectedId = next.id;
  } else {
    updateSelected(next);
    if (next.status === "booting") {
      window.setTimeout(() => {
        const current = selectedVm();
        if (current?.id === next.id && current.status === "booting") {
          updateSelected(markVmRunning(current, new Date().toISOString()));
          persist();
          render();
        }
      }, 1200);
    }
  }

  persist();
  render();
}

function render() {
  const vm = selectedVm();
  if (!vm) return;

  elements.selectedTitle.textContent = vm.name;
  elements.title.textContent = vm.name;
  elements.status.textContent = vm.status;
  elements.summary.textContent = `${vm.architecture} guest profile, ${vm.memoryMB} MB RAM, ${vm.cpuThreads} virtual CPU threads, ${vm.storage.sizeGB} GB ${vm.storage.backend} disk.`;
  elements.frameRate.textContent = vm.status === "running" ? "60 fps" : vm.status === "booting" ? "24 fps" : "0 fps";

  renderVmList(vm);
  renderScreen(vm);
  renderSettings(vm);
  renderSnapshots(vm);
  renderActivity(vm);
  renderHardware();
}

function renderVmList(selected) {
  elements.vmList.innerHTML = state.vms
    .map(
      (vm) => `
        <button class="vm-item ${vm.id === selected.id ? "active" : ""}" type="button" data-vm-id="${vm.id}">
          <span class="vm-row">
            <strong>${escapeHtml(vm.name)}</strong>
            <span class="dot ${vm.status}" aria-label="${vm.status}"></span>
          </span>
          <span>${vm.memoryMB} MB / ${vm.renderer}</span>
        </button>
      `,
    )
    .join("");
}

function renderScreen(vm) {
  const bootLines = {
    stopped: [
      "nulator firmware monitor",
      "State: powered off",
      "Press Start to simulate boot.",
    ],
    booting: [
      "SeaBIOS-compatible shim initializing...",
      "Detecting virtual disk: OK",
      "Mapping framebuffer: OK",
      "Starting guest display pipeline...",
    ],
    running: [
      "Debian XFCE demo session",
      "Display server: simulated",
      "Input: keyboard + pointer attached",
      "Network mode: browser-safe proxy preview",
      "",
      "This is not real emulation yet. It is the VM manager shell proving the workflow.",
    ],
    paused: [
      "Execution paused",
      "Framebuffer retained",
      "Snapshot controls available",
    ],
    error: [
      "Guest halted",
      vm.lastError || "Unknown simulated error",
    ],
  };

  elements.screen.textContent = (bootLines[vm.status] ?? bootLines.stopped).join("\n");
}

function renderSettings(vm) {
  const rows = [
    ["Architecture", vm.architecture],
    ["Memory", `${vm.memoryMB} MB`],
    ["CPU threads", vm.cpuThreads],
    ["Renderer", vm.renderer],
    ["Network", vm.networkMode],
    ["Firmware", vm.firmware.type],
    ["Display", `${vm.display.width} x ${vm.display.height}`],
    ["Profile", vm.profile],
  ];

  elements.vmSettings.innerHTML = rows.map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join("");
}

function renderSnapshots(vm) {
  if (vm.snapshots.length === 0) {
    elements.snapshots.innerHTML = `<p class="empty">No snapshots yet. Start the VM, then capture one.</p>`;
    return;
  }

  elements.snapshots.innerHTML = vm.snapshots
    .map(
      (snapshot) => `
        <div class="snapshot">
          <strong>${escapeHtml(snapshot.name)}</strong>
          <p>${new Date(snapshot.createdAt).toLocaleString()} / ${snapshot.status}</p>
        </div>
      `,
    )
    .join("");
}

function renderActivity(vm) {
  elements.activityLog.innerHTML = vm.activityLog
    .map((entry) => `<li><time>${new Date(entry.at).toLocaleTimeString()}</time> ${escapeHtml(entry.message)}</li>`)
    .join("");
}

function renderHardware() {
  elements.hardwareProfile.textContent = state.capabilities.profile;
  const rows = [
    ["CPU hint", state.capabilities.cpuThreads ?? "unavailable"],
    ["Memory hint", state.capabilities.memoryGB ? `${state.capabilities.memoryGB} GB` : "unavailable"],
    ["WebGPU", state.capabilities.webgpu ? "available" : "not detected"],
    ["WebGL", state.capabilities.webgl ? "available" : "not detected"],
    ["OPFS", state.capabilities.opfs ? "available" : "not detected"],
    ["Persistent storage", state.capabilities.persistentStorage ? "available" : "not granted"],
  ];

  elements.hardwareMetrics.innerHTML = rows.map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join("");
}

function selectedVm() {
  return state.vms.find((vm) => vm.id === state.selectedId) ?? state.vms[0];
}

function updateSelected(nextVm) {
  state.vms = state.vms.map((vm) => (vm.id === nextVm.id ? nextVm : vm));
}

function appendSelectedActivity(message) {
  const vm = selectedVm();
  if (!vm) return;
  updateSelected({
    ...vm,
    activityLog: [{ at: new Date().toISOString(), message }, ...vm.activityLog].slice(0, 12),
  });
  persist();
  render();
}

function loadVmInventory() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEEDED_VMS;
  } catch {
    return SEEDED_VMS;
  }
}

function persist() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.vms));
}

async function detectCapabilities() {
  const canvas = document.createElement("canvas");
  const webgl = Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  const storage = navigator.storage;
  const persistentStorage = storage?.persist ? await storage.persist().catch(() => false) : false;

  return {
    cpuThreads: navigator.hardwareConcurrency,
    memoryGB: navigator.deviceMemory,
    webgpu: Boolean(navigator.gpu),
    webgl,
    opfs: Boolean(storage?.getDirectory),
    persistentStorage,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
