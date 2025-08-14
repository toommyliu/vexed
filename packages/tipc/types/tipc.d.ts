import { ActionFunction } from "./types";
declare const tipc: {
    create(): {
        procedure: {
            input<TInput>(): {
                input<TInput_1>(): {
                    input<TInput_2>(): {
                        input<TInput_3>(): {
                            input<TInput_4>(): {
                                input<TInput_5>(): {
                                    input<TInput_6>(): {
                                        input<TInput_7>(): {
                                            input<TInput_8>(): {
                                                input<TInput_9>(): {
                                                    input<TInput_10>(): any;
                                                    action: <TResult>(action: ActionFunction<TInput_9, TResult>) => {
                                                        action: ActionFunction<TInput_9, TResult>;
                                                    };
                                                };
                                                action: <TResult_1>(action: ActionFunction<TInput_8, TResult_1>) => {
                                                    action: ActionFunction<TInput_8, TResult_1>;
                                                };
                                            };
                                            action: <TResult_2>(action: ActionFunction<TInput_7, TResult_2>) => {
                                                action: ActionFunction<TInput_7, TResult_2>;
                                            };
                                        };
                                        action: <TResult_3>(action: ActionFunction<TInput_6, TResult_3>) => {
                                            action: ActionFunction<TInput_6, TResult_3>;
                                        };
                                    };
                                    action: <TResult_4>(action: ActionFunction<TInput_5, TResult_4>) => {
                                        action: ActionFunction<TInput_5, TResult_4>;
                                    };
                                };
                                action: <TResult_5>(action: ActionFunction<TInput_4, TResult_5>) => {
                                    action: ActionFunction<TInput_4, TResult_5>;
                                };
                            };
                            action: <TResult_6>(action: ActionFunction<TInput_3, TResult_6>) => {
                                action: ActionFunction<TInput_3, TResult_6>;
                            };
                        };
                        action: <TResult_7>(action: ActionFunction<TInput_2, TResult_7>) => {
                            action: ActionFunction<TInput_2, TResult_7>;
                        };
                    };
                    action: <TResult_8>(action: ActionFunction<TInput_1, TResult_8>) => {
                        action: ActionFunction<TInput_1, TResult_8>;
                    };
                };
                action: <TResult_9>(action: ActionFunction<TInput, TResult_9>) => {
                    action: ActionFunction<TInput, TResult_9>;
                };
            };
            action: <TResult_10>(action: ActionFunction<void, TResult_10>) => {
                action: ActionFunction<void, TResult_10>;
            };
        };
    };
};
export { tipc };
