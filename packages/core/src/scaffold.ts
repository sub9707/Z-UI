import { ZuiServer } from "./server";
import { ClientMessage, ServerMessage } from "./protocol";
import path from "path";
import fs from "fs";

type Field = { name: string; type: string };
type ScaffoldOptions = { color: string; register: boolean };

export const TRASH_DIR_NAME = ".zui-trash";

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

const defaultValueFor = (type: string): string => {
  if (type.endsWith("[]")) return "[]";
  if (type.includes("=>")) return "() => {}";

  switch (type) {
    case "string":
      return "''";
    case "number":
      return "0";
    case "boolean":
      return "false";
    default:
      return "null";
  }
};

const generateStoreTemplate = (
  name: string,
  fields: Field[],
  options?: ScaffoldOptions,
): string => {
  const baseName = name.replace(/Store$/, "");
  const stateName = `${capitalize(baseName)}State`;
  const hookName = `use${capitalize(name)}`;

  const fieldDeclarations = fields
    .map((field) => `  ${field.name}: ${field.type};`)
    .join("\n");
  const initialValues = fields
    .map((field) => `  ${field.name}: ${defaultValueFor(field.type)},`)
    .join("\n");

  const body = `import {create} from 'zustand';
${options?.register ? 'import {zui} from "@z-ui/core";' : "" }

type ${stateName} = {
    ${fieldDeclarations}
};

export const ${hookName} = create<${stateName}>()((set) => ({
${initialValues}
}));
`;

  if (!options?.register) return body;

  return `${body}
zui('${name}', ${hookName}, { color: '${options.color}' });
`;
};

const getStoreFilePath = (storeName: string): string | null => {
  const storesDir = path.resolve(process.cwd(), "src/stores");
  const filePath = path.resolve(storesDir, `${storeName}.ts`);

  if (filePath !== storesDir && !filePath.startsWith(storesDir + path.sep)) {
    return null;
  }

  return filePath;
};

const sendActionResult = (
  server: ZuiServer,
  name: string,
  success: boolean,
  reason: string,
): void => {
  const result: ServerMessage = {
    type: "STORE_ACTION_RESULT",
    name,
    success,
    reason,
  };
  server.broadcast(result);
};

const handleScaffoldStore = (
  server: ZuiServer,
  message: Extract<ClientMessage, { type: "SCAFFOLD_STORE" }>,
): void => {
  const filePath = getStoreFilePath(message.name);

  if (!filePath) {
    sendActionResult(server, message.name, false, "Invalid store name.");
    return;
  }

  if (fs.existsSync(filePath)) {
    sendActionResult(server, message.name, false, "File already existed.");
    return;
  }

  const source = generateStoreTemplate(message.name, message.fields, {
    color: message.color,
    register: message.register,
  });
  fs.writeFileSync(filePath, source);
  sendActionResult(server, message.name, true, "File created successfully.");
};

const handleDeleteStore = (
  server: ZuiServer,
  message: Extract<ClientMessage, { type: "DELETE_STORE" }>,
): void => {
  const sourcePath = getStoreFilePath(message.name);

  if (!sourcePath) {
    sendActionResult(server, message.name, false, "Invalid store name.");
    return;
  }

  if (fs.existsSync(sourcePath)) {
    const trashDir = path.resolve(process.cwd(), TRASH_DIR_NAME);
    fs.mkdirSync(trashDir, { recursive: true });
    fs.renameSync(sourcePath, path.resolve(trashDir, `${message.name}.ts`));
  }

  const removeMessage: ServerMessage = {
    type: "STORE_REMOVE",
    name: message.name,
  };
  server.broadcast(removeMessage);
};

export const handleZuiMessage = (
  server: ZuiServer,
  message: ClientMessage,
): void => {
  if (message.type === "SCAFFOLD_STORE") {
    handleScaffoldStore(server, message);
    return;
  }
  if (message.type === "DELETE_STORE") {
    handleDeleteStore(server, message);
    return;
  }
  server.broadcast(message as unknown as ServerMessage);
};
