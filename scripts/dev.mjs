import { spawn } from "node:child_process";
import process from "node:process";

const services = [
  {
    name: "Orbital API",
    args: ["--env-file-if-exists=.env", "server/index.mjs"],
  },
  {
    name: "Vite",
    args: ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"],
  },
];

const children = services.map(({ args }) =>
  spawn(process.execPath, args, { stdio: "inherit" }),
);
let stopping = false;

function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
}

children.forEach((child, index) => {
  child.on("error", (error) => {
    console.error(`${services[index].name} could not start: ${error.message}`);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (stopping) return;
    if (signal) console.error(`${services[index].name} stopped (${signal}).`);
    stop(code ?? 1);
  });
});

process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));

