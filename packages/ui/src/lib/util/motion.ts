import type {
    BlurParams,
    FadeParams,
    FlyParams,
    ScaleParams,
    SlideParams,
    TransitionConfig,
} from "svelte/transition";
import { blur, fade, fly, scale, slide } from "svelte/transition";

/**
 * Checks if the user prefers reduced motion.
 */
function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Wraps a Svelte transition to respect the user's motion preferences.
 * If the user prefers reduced motion, the transition duration is set to 0.
 */
function createMotionAwareTransition<T extends TransitionConfig>(
    transitionFn: (node: Element, params?: any) => T,
) {
    return (node: Element, params?: any): T => {
        const result = transitionFn(node, params);
        if (prefersReducedMotion()) {
            return {
                ...result,
                duration: 0,
            };
        }
        return result;
    };
}

/**
 * Motion-aware version of the `scale` transition.
 */
export const motionScale = createMotionAwareTransition(scale);

/**
 * Motion-aware version of the `fade` transition.
 */
export const motionFade = createMotionAwareTransition(fade);

/**
 * Motion-aware version of the `fly` transition.
 */
export const motionFly = createMotionAwareTransition(fly);

/**
 * Motion-aware version of the `slide` transition.
 */
export const motionSlide = createMotionAwareTransition(slide);

/**
 * Motion-aware version of the `blur` transition.
 */
export const motionBlur = createMotionAwareTransition(blur);

export type {
    BlurParams,
    FadeParams,
    FlyParams,
    ScaleParams,
    SlideParams,
    TransitionConfig,
};
