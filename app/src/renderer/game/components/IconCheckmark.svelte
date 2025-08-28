<div
  class="option-checkmark"
  style="background-color: transparent !important; isolation: isolate; position: relative; z-index: 1;"
>
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="h-4 w-4 text-green-400"
  >
    <path
      d="M5 10.5l4 4 6-8"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</div>

<style>
  .option-checkmark {
    display: flex;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
  }

  .option-checkmark svg {
    width: 16px;
    height: 16px;
  }

  :global(.option-active .option-checkmark) {
    opacity: 1;
    visibility: visible;
  }
</style>
