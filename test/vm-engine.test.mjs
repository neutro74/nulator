import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyHardwareProfile,
  cloneVm,
  createSnapshot,
  createVm,
  pauseVm,
  resetVm,
  resumeVm,
  startVm,
  stopVm,
} from "../src/vm-engine.mjs";

test("starting a stopped VM moves it to booting with boot activity", () => {
  const vm = createVm({ name: "Debian XFCE" });
  const next = startVm(vm, "2026-04-28T12:00:00.000Z");

  assert.equal(next.status, "booting");
  assert.equal(next.activityLog[0].message, "Power on requested");
});

test("pause and resume only work from valid states", () => {
  const stopped = createVm({ name: "Alpine CLI" });

  assert.equal(pauseVm(stopped).status, "stopped");
  assert.equal(pauseVm(stopped).lastError, "Cannot pause while stopped");

  const running = { ...stopped, status: "running" };
  const paused = pauseVm(running, "2026-04-28T12:01:00.000Z");

  assert.equal(paused.status, "paused");

  const resumed = resumeVm(paused, "2026-04-28T12:02:00.000Z");

  assert.equal(resumed.status, "running");
});

test("stop and reset produce predictable lifecycle states", () => {
  const running = { ...createVm({ name: "Arch Lab" }), status: "running" };

  assert.equal(stopVm(running, "2026-04-28T12:03:00.000Z").status, "stopped");
  assert.equal(resetVm(running, "2026-04-28T12:04:00.000Z").status, "booting");
});

test("snapshot creation updates metadata and activity", () => {
  const running = { ...createVm({ name: "Debian XFCE" }), status: "running" };
  const snapshotted = createSnapshot(running, "Clean desktop", "2026-04-28T12:05:00.000Z");

  assert.equal(snapshotted.snapshots.length, 1);
  assert.equal(snapshotted.snapshots[0].name, "Clean desktop");
  assert.equal(snapshotted.activityLog[0].message, "Snapshot created: Clean desktop");
});

test("cloning creates a stopped copy with independent identity", () => {
  const vm = { ...createVm({ name: "Debian XFCE" }), status: "running" };
  const copy = cloneVm(vm, "Debian XFCE Copy", "2026-04-28T12:06:00.000Z");

  assert.equal(copy.name, "Debian XFCE Copy");
  assert.equal(copy.status, "stopped");
  assert.notEqual(copy.id, vm.id);
});

test("hardware classifier handles low, balanced, high, and missing data", () => {
  assert.equal(classifyHardwareProfile({ cpuThreads: 2, memoryGB: 2, webgpu: false, webgl: true }), "low-end");
  assert.equal(classifyHardwareProfile({ cpuThreads: 8, memoryGB: 8, webgpu: false, webgl: true }), "balanced");
  assert.equal(classifyHardwareProfile({ cpuThreads: 16, memoryGB: 16, webgpu: true, webgl: true }), "high-performance");
  assert.equal(classifyHardwareProfile({}), "balanced");
});
