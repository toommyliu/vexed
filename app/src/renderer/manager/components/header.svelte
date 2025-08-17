<script lang="ts">
  type Props = {
    onclick: () => void;
  };

  const { onclick }: Props = $props();
</script>

<header class="mb-8">
  <div class="flex items-center justify-end">
    <button
      {onclick}
      class="group flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-1.5 font-medium text-white shadow-lg transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      title="Add a new account"
    >
      Add Account
    </button>
  </div>
</header>
