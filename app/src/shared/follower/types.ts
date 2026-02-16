export type RawFollowerConfig = {
  attackPriority: string;
  copyWalk: boolean;
  name: string;
  safeSkill: string;
  safeSkillEnabled: boolean;
  safeSkillHp: string;
  skillDelay: string;
  skillList: string;
  skillWait: boolean;
};

export type FollowerConfig = {
  attackPriority: string[];
  copyWalk: boolean;
  name: string;
  safeSkill: string[];
  safeSkillEnabled: boolean;
  safeSkillHp: number;
  skillDelay: number;
  skillList: string[];
  skillWait: boolean;
}