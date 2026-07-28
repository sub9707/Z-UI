import path from 'path';

type Field = { name: string; type: string };

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

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

function generateStoreTemplate(name: string, fields: Field[]): string {
    const baseName = name.replace(/Store$/, "");
    const stateName = `${capitalize(baseName)}State`;
    const hookName = `use${capitalize(name)}`;

    const fieldDeclarations = fields.map((field) => `  ${field.name}: ${field.type};`).join("\n");
    const initialValues = fields.map((field) => `  ${field.name}: ${defaultValueFor(field.type)},`).join("\n");

    return `type ${stateName} = {
${fieldDeclarations}
};

export const ${hookName} = create<${stateName}>()((set) => ({
${initialValues}
}));
`;
}

console.log(generateStoreTemplate("userStore", [
    { name: "id", type: "string" },
    { name: "age", type: "number" },
]));

const getStoreFilePath = (storeName:string):string =>{
    return path.resolve(process.cwd(), 'src/stores', `${storeName}.ts`);
}