// https://github.com/Froztt13/Grimlite-Li/blob/master/bin/Debug/ClientConfig.cfg

// SCARLET SORCERESS=1:SH>60;2;3;4:SH>60|500
// Use skill 1 if hp is greater than 60%
// Use skill 2
// Use skill 3
// Use skill 4 if hp is greater than 60%
// Delay of 500ms between skills

const SEP_TOKEN = ";"; // separator between skill indices
const SAFE_SEP_TOKEN = ":"; // separator between skill index and condition
const VALID_OPERATORS = [">=", "<=", ">", "<"] as const;
const SAFE_HP_TOKEN = "SH";
const SAFE_MP_TOKEN = "SM";
const WAIT_TOKEN = "W";
const DELAY_TOKEN = "|"; // separator for delay at the end of skill list

type Operator = (typeof VALID_OPERATORS)[number];

export class SkillSet {
  #skills: Skill[] = [];

  #delay?: number;

  public addSkill(skill: Skill) {
    this.#skills.push(skill);
  }

  public addSkills(skills: Skill[]) {
    this.#skills.push(...skills);
  }

  public get skills() {
    return this.#skills;
  }

  public setDelay(delay: number) {
    this.#delay = delay;
  }

  public get delay() {
    return this.#delay;
  }

  public toString() {
    const skillString = this.#skills
      .map((skill) => skill.toString())
      .join(SEP_TOKEN);
    return this.#delay
      ? `${skillString}${DELAY_TOKEN}${this.#delay}`
      : skillString;
  }
}

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
  public operator?: Operator;

  /**
   * True when this skill has an HP-based condition (SH).
   */
  public isHp = false;

  /**
   * True when this skill has an MP-based condition (SM).
   */
  public isMp = false;

  /**
   * True when this skill has a wait condition (W).
   */
  public isWait = false;

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

  public isWaitSkill() {
    return this.isWait;
  }

  public setValue(value: number) {
    this.value = value;
  }

  public setOperator(operator: Operator) {
    if (VALID_OPERATORS.includes(operator)) this.operator = operator;
  }

  public setHp(isHp: boolean) {
    this.isHp = isHp;
  }

  public setMp(isMp: boolean) {
    this.isMp = isMp;
  }

  public setWait(isWait: boolean) {
    this.isWait = isWait;
  }

  public toString() {
    const waitFlag = this.isWait ? WAIT_TOKEN : "";
    const safeCondition = this.isHp
      ? SAFE_HP_TOKEN
      : this.isMp
        ? SAFE_MP_TOKEN
        : "";
    const opCondition = this.operator ? this.operator + (this.value ?? "") : "";

    const separator =
      waitFlag && (safeCondition || opCondition) ? SAFE_SEP_TOKEN : "";

    return `${this.index}${waitFlag}${separator}${safeCondition}${opCondition}`;
  }
}

export function parseSkillString(skillString: string) {
  const delayTokenIndex = skillString.lastIndexOf(DELAY_TOKEN);
  let delay: number | undefined;
  let skillsString = skillString;

  // Parse the delay if present
  if (delayTokenIndex !== -1) {
    const delayPart = skillString.slice(delayTokenIndex + 1).trim();
    const parsedDelay = Number.parseInt(delayPart, 10);
    if (!Number.isNaN(parsedDelay)) {
      delay = parsedDelay;
      skillsString = skillString.slice(0, delayTokenIndex);
    }
  }

  const parts = skillsString
    .split(SEP_TOKEN)
    .map((partStr) => partStr.trim())
    .filter(Boolean);

  const skillSet = new SkillSet();

  for (const part of parts) {
    const skill = parseSkillPart(part);
    if (skill) skillSet.addSkill(skill);
  }

  if (delay !== undefined) {
    skillSet.setDelay(delay);
  }

  return skillSet;
}

function parseSkillPart(part: string) {
  if (typeof part !== "string") return null;

  // Ordinary skill: no safe condition present
  if (!part.includes(SAFE_SEP_TOKEN)) {
    const skill = new Skill(part.trim());
    if (typeof skill.index !== "number" || skill.index < 0 || skill.index > 5)
      return null;

    return skill;
  }

  const [index, ...conditions] = part.split(SAFE_SEP_TOKEN);
  if (!index) return null;

  const skill = new Skill(index);
  if (typeof skill.index !== "number" || skill.index < 0 || skill.index > 5)
    return null;

  // Ensure longer operators are matched first
  const operators = [...VALID_OPERATORS].sort(
    (currOp, nextOp) => nextOp.length - currOp.length,
  ) as Operator[];
  let safeAssigned = false;

  for (const condition of conditions) {
    if (!condition) continue;

    // Check for wait condition first
    if (condition.trim() === WAIT_TOKEN) {
      skill.setWait(true);
      continue;
    }

    let foundOp: Operator | null = null;
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
      if (left === SAFE_HP_TOKEN) {
        skill.setHp(true);
        safeAssigned = true;
      } else if (left === SAFE_MP_TOKEN) {
        skill.setMp(true);
        safeAssigned = true;
      }
    }

    skill.setOperator(foundOp);
    skill.setValue(parsed);
  }

  return skill;
}
