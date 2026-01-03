const SEP_TOKEN = ";"; // separator between skill indices
const SAFE_SEP_TOKEN = ":"; // separator between skill index and condition
const VALID_OPERATORS = [">=", "<=", ">", "<"] as const;
const SAFE_HP_TOKEN = "SH";
const SAFE_MP_TOKEN = "SM";
const WAIT_TOKEN = "W";
const DELAY_TOKEN = "|"; // separator for delay at the end of skill list

type Operator = (typeof VALID_OPERATORS)[number];

export type SkillCondition = {
  type: "hp" | "mp";
  operator: Operator;
  value: number;
};

export type SkillJson = {
  index: number;
  wait?: boolean;
  condition?: SkillCondition;
};

/** A skill can be just a number (index) or a full object */
export type SkillJsonInput = number | SkillJson;

export type SkillSetJson = {
  skills: SkillJsonInput[];
  delay?: number;
};

export type SkillSetsConfig = Record<string, SkillSetJson>;

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

  public toJSON(): SkillSetJson {
    return {
      skills: this.#skills.map((skill) => skill.toJSON()),
      ...(this.#delay !== undefined && { delay: this.#delay }),
    };
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

  public toJSON(): SkillJson {
    const result: SkillJson = { index: this.index };

    if (this.isWait) {
      result.wait = true;
    }

    if ((this.isHp || this.isMp) && this.operator && this.value !== undefined) {
      result.condition = {
        type: this.isHp ? "hp" : "mp",
        operator: this.operator,
        value: this.value,
      };
    }

    return result;
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

/**
 * Parse a JSON-based skillset configuration into a SkillSet object.
 *
 * @example
 * ```json
 * {
 *   "skills": [
 *     { "index": 3 },
 *     { "index": 4 },
 *     { "index": 1, "wait": true },
 *     { "index": 2, "condition": { "type": "hp", "operator": ">", "value": 60 } }
 *   ],
 *   "delay": 150
 * }
 * ```
 */
export function parseSkillSetJson(json: SkillSetJson): SkillSet {
  const skillSet = new SkillSet();

  for (const skillInput of json.skills) {
    // Handle shorthand number format: [3, 4, 1, 2]
    if (typeof skillInput === "number") {
      if (skillInput < 0 || skillInput > 5) continue;
      skillSet.addSkill(new Skill(skillInput));
      continue;
    }

    // Handle full object format: { index: 3, wait: true, condition: {...} }
    const skill = new Skill(skillInput.index);

    if (skill.index < 0 || skill.index > 5) {
      continue;
    }

    skill.setWait(skillInput.wait ?? false);

    if (skillInput.condition) {
      const { type, operator, value } = skillInput.condition;

      skill.setHp(type === "hp");
      skill.setMp(type === "mp");

      if (VALID_OPERATORS.includes(operator)) {
        skill.setOperator(operator);
      }

      skill.setValue(value);
    }

    skillSet.addSkill(skill);
  }

  if (json.delay !== undefined) {
    skillSet.setDelay(json.delay);
  }

  return skillSet;
}
