// https://github.com/Froztt13/Grimlite-Li/blob/master/bin/Debug/ClientConfig.cfg

// SCARLET SORCERESS=1:SH>60;2;3;4:SH>60
// Use skill 1 if hp is greater than 60%
// Use skill 2
// Use skill 3
// Use skill 4 if hp is greater than 60%

const SEP = ";"; // separator between skill indices
const SAFE_SEP = ":"; // separator between skill index and condition
const VALID_OPERATORS = [">=", "<=", ">", "<"];
const SAFE_HP = "SH";
const SAFE_MP = "SM";

class Skill {
  /**
   * The index of the skill.
   *
   * Auto attack = 0
   * Potion = 5
   */
  public index!: number;

  /**
   * The percentage value for the HP/MP condition.
   */
  public value?: number;

  /**
   * The comparison operator for the condition.
   */
  public operator?: string;

  /**
   * True when this skill has an HP-based condition (SH).
   */
  public isHp = false;

  /**
   * True when this skill has an MP-based condition (SM).
   */
  public isMp = false;

  public constructor(index: number | string) {
    if (typeof index === "number") {
      this.index = index;
    } else {
      const tmp = Number.parseInt(index, 10);
      if (!Number.isNaN(tmp)) this.index = tmp;
    }
  }

  public isSafe() {
    return this.isHp || this.isMp;
  }

  public setValue(value: number) {
    this.value = value;
  }

  public setOperator(operator: string) {
    if (VALID_OPERATORS.includes(operator)) this.operator = operator;
  }

  public setHp(isHp: boolean) {
    this.isHp = isHp;
  }

  public setMp(isMp: boolean) {
    this.isMp = isMp;
  }
}

export function parseSkillString(skillString: string) {
  const parts = skillString
    .split(SEP)
    .map((partStr) => partStr.trim())
    .filter(Boolean);
  const skills: Skill[] = [];

  for (const part of parts) {
    const skill = parseSkillPart(part);
    if (skill) skills.push(skill);
  }

  return skills;
}

function parseSkillPart(part: string) {
  if (typeof part !== "string") return null;

  // Ordinary skill: no ':' present
  if (!part.includes(SAFE_SEP)) {
    const skill = new Skill(part.trim());
    if (typeof skill.index !== "number" || skill.index < 0 || skill.index > 5)
      return null;
    return skill;
  }

  const [index, ...conditions] = part.split(":");
  if (!index) return null;

  const skill = new Skill(index);
  if (typeof skill.index !== "number" || skill.index < 0 || skill.index > 5)
    return null;

  // Ensure longer operators are matched first
  const operators = [...VALID_OPERATORS].sort((a, b) => b.length - a.length);
  let safeAssigned = false;

  for (const condition of conditions) {
    if (!condition) continue;

    let foundOp: string | null = null;
    let opIdx = -1;

    for (const op of operators) {
      const idx = condition.indexOf(op);
      if (idx !== -1) {
        foundOp = op;
        opIdx = idx;
        break;
      }
    }

    if (!foundOp) continue;

    const left = condition.slice(0, opIdx).trim();
    const right = condition.slice(opIdx + foundOp.length).trim();
    const parsed = Number.parseInt(right, 10);
    if (Number.isNaN(parsed)) continue;

    if (!safeAssigned) {
      if (left === SAFE_HP) {
        skill.setHp(true);
        safeAssigned = true;
      } else if (left === SAFE_MP) {
        skill.setMp(true);
        safeAssigned = true;
      }
    }

    skill.setOperator(foundOp);
    skill.setValue(parsed);
  }

  return skill;
}
