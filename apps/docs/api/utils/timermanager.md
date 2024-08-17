---
title: TimerManager
outline: deep
---
# TimerManager

Manager for timers and intervals.



## Methods

### setInterval
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| fn | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/function">Function</a></code> | The interval function. |
| interval | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The delay between each execution. |

**Returns:** `SetIntervalAsyncTimer`

The interval id.

### clearInterval
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| id | `SetIntervalAsyncTimer` | The interval id. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### setTimeout
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| fn | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/function">Function</a></code> | The timeout function. |
| delay | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The delay before executing the function. |
| args | `...any` | Arguments to pass to the function. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

The timeout id.

### clearTimeout
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| timeout | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The timeout id. |

**Returns:** `void`
