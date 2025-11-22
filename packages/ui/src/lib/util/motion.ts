import type {
    BlurParams,
    CrossfadeParams,
    DrawParams,
    FadeParams,
    FlyParams,
    ScaleParams,
    SlideParams,
    TransitionConfig,
} from "svelte/transition";
import { blur, crossfade, draw, fade, fly, scale, slide } from "svelte/transition";

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
function createMotionAwareTransition<
    T extends TransitionConfig,
    E extends Element = Element,
>(transitionFn: (node: E, params?: any) => T) {
    return (node: E, params?: any): T => {
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
 * Wraps Svelte crossfade transition to respect the user's motion preferences.
 */
function createMotionAwareCrossfadeTransition(
    transitionFn: (node: any, params: any) => () => TransitionConfig,
) {
    return (node: any, params: any) => {
        const makeConfig = transitionFn(node, params);
        return () => {
            const config = makeConfig();
            if (prefersReducedMotion()) {
                return {
                    ...config,
                    duration: 0,
                };
            }
            return config;
        };
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

/**
 * Motion-aware version of the `draw` transition.
 */
export const motionDraw = createMotionAwareTransition(draw);

/**
 * Motion-aware version of the `crossfade` transition.
 */
export const motionCrossfade = (params: CrossfadeParams) => {
    const [send, receive] = crossfade(params);
    return [
        createMotionAwareCrossfadeTransition(send),
        createMotionAwareCrossfadeTransition(receive),
    ] as const;
};

export type {
    BlurParams,
    CrossfadeParams,
    DrawParams,
    FadeParams,
    FlyParams,
    ScaleParams,
    SlideParams,
    TransitionConfig,
};
