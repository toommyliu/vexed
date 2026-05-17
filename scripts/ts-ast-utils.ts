import ts from "typescript";

export type TypeReferenceInfo = {
  readonly name: string;
  readonly unqualifiedName: string;
  readonly args: readonly ts.TypeNode[];
};

export const getPropertyName = (name: ts.PropertyName): string | null => {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }
  return null;
};

const getEntityNameText = (name: ts.EntityName): string =>
  ts.isIdentifier(name)
    ? name.text
    : `${getEntityNameText(name.left)}.${name.right.text}`;

const getUnqualifiedEntityName = (name: ts.EntityName): string =>
  ts.isIdentifier(name) ? name.text : name.right.text;

export const parseTypeReference = (
  node: ts.TypeNode | undefined,
): TypeReferenceInfo | null => {
  if (!node || !ts.isTypeReferenceNode(node)) {
    return null;
  }

  return {
    name: getEntityNameText(node.typeName),
    unqualifiedName: getUnqualifiedEntityName(node.typeName),
    args: Array.from(node.typeArguments ?? []),
  };
};

export const literalTypeNames = (node: ts.TypeNode | undefined): Set<string> => {
  const names = new Set<string>();
  if (node === undefined) {
    return names;
  }

  const visit = (current: ts.TypeNode): void => {
    if (
      ts.isLiteralTypeNode(current) &&
      ts.isStringLiteralLike(current.literal)
    ) {
      names.add(current.literal.text);
      return;
    }

    if (ts.isUnionTypeNode(current)) {
      for (const child of current.types) {
        visit(child);
      }
    }
  };

  visit(node);
  return names;
};

export const omitInterfaceMembers = (
  declaration: ts.InterfaceDeclaration,
  omitted: ReadonlySet<string>,
): ts.InterfaceDeclaration => ({
  ...declaration,
  members: ts.factory.createNodeArray(
    declaration.members.filter((member) => {
      if (!ts.isMethodSignature(member) && !ts.isPropertySignature(member)) {
        return true;
      }

      const name = getPropertyName(member.name);
      return name === null || !omitted.has(name);
    }),
  ),
});

export const resolveOmitInterfaceAlias = (
  reference: TypeReferenceInfo,
  resolveTarget: (name: string) => ts.InterfaceDeclaration,
  options: {
    readonly referenceName?: "name" | "unqualifiedName";
  } = {},
): ts.InterfaceDeclaration | null => {
  if (reference.unqualifiedName !== "Omit" || reference.args.length < 2) {
    return null;
  }

  const target = parseTypeReference(reference.args[0]);
  if (!target) {
    return null;
  }

  const referenceName = options.referenceName ?? "name";
  return omitInterfaceMembers(
    resolveTarget(target[referenceName]),
    literalTypeNames(reference.args[1]),
  );
};
