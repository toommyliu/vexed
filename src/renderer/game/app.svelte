<script lang="ts">
  import "./entrypoint";
</script>

<main
  class="m-0 flex h-screen flex-col overflow-hidden bg-black text-white focus:outline-none"
>
  <div id="topnav-container" class="invisible min-h-8 bg-[#111113] opacity-0">
    <div id="topnav" class="flex w-full flex-wrap items-center">
      <div class="flex">
        <div class="relative inline-block cursor-pointer" id="scripts-dropdown">
          <button class="px-4 py-2 text-xs hover:bg-gray-700" id="scripts">
            Scripts
          </button>
          <div
            class="absolute z-10 hidden min-w-40 text-xs"
            id="scripts-dropdowncontent"
          >
            <button
              class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              Load
            </button>
            <button
              class="block w-full cursor-not-allowed px-4 py-2 text-left text-xs opacity-50"
              disabled
            >
              Start
            </button>
            <button
              class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              <span>Show Overlay</span>
            </button>
            <button
              class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              Toggle Dev Tools
            </button>
          </div>
        </div>
        <div class="relative inline-block cursor-pointer" id="tools-dropdown">
          <button class="px-4 py-2 text-xs hover:bg-gray-700" id="tools">
            Tools
          </button>
          <div
            class="absolute z-10 hidden min-w-40 text-xs"
            id="tools-dropdowncontent"
          >
            <button
              class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              Fast Travels
            </button>
            <button
              class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              Loader/Grabber
            </button>
            <button
              class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              Follower
            </button>
          </div>
        </div>
        <div class="relative inline-block cursor-pointer" id="packets-dropdown">
          <button class="px-4 py-2 text-xs hover:bg-gray-700" id="packets">
            Packets
          </button>
          <div
            class="absolute z-10 hidden min-w-40 text-xs"
            id="packets-dropdowncontent"
          >
            <button
              class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              Logger
            </button>
            <button
              class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              Spammer
            </button>
          </div>
        </div>
        <div
          class="group relative inline-block cursor-pointer"
          id="options-dropdown"
        >
          <button class="px-4 py-2 text-xs hover:bg-gray-700" id="options">
            Options
          </button>
          <div
            class="absolute z-10 hidden min-w-40 text-xs group-hover:block"
            id="options-dropdowncontent"
          >
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-infinite-range"
            >
              <span>Infinite Range</span>
            </button>
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-provoke-map"
            >
              <span>Provoke Map</span>
            </button>
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-provoke-cell"
            >
              <span>Provoke Cell</span>
            </button>
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-enemy-magnet"
            >
              <span>Enemy Magnet</span>
            </button>
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-lag-killer"
            >
              <span>Lag Killer</span>
            </button>
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-hide-players"
            >
              <span>Hide Players</span>
            </button>
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-skip-cutscenes"
            >
              <span>Skip Cutscenes</span>
            </button>
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-disable-fx"
            >
              <span>Disable FX</span>
            </button>
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
              id="option-disable-collisions"
            >
              <span>Disable Collisions</span>
            </button>
            <div
              class="block w-full cursor-default items-center justify-between px-4 py-2 text-left text-xs"
              id="option-walkspeed"
            >
              <span>Walk Speed</span>
              <input
                type="number"
                class="walkspeed-input"
                value="8"
                min="0"
                max="99"
              />
            </div>
          </div>
        </div>
        <div
          class="group relative inline-block cursor-pointer"
          id="autoaggro-dropdown"
        >
          <button class="px-4 py-2 text-xs hover:bg-gray-700" id="autoaggro">
            Auto Aggro
          </button>
          <div
            class="absolute z-10 hidden min-w-40 text-xs group-hover:block"
            id="autoaggro-dropdowncontent"
          >
            <button
              class="block w-full items-center justify-between px-4 py-2 text-left text-xs hover:bg-gray-700"
            >
              <span>Enabled</span>
            </button>
          </div>
        </div>
      </div>
      <div class="ml-auto mr-2 flex items-center gap-4">
        <div class="ml-1.5 flex">
          <div
            class="relative mt-1.5 inline-block h-[25px] w-[86px] cursor-pointer"
            id="pads-dropdown"
          >
            <button
              class="h-full w-full cursor-not-allowed border border-gray-400 p-0 text-xs opacity-50"
              id="pads"
              disabled
            ></button>
            <div class="absolute top-8 text-xs" id="pads-dropdowncontent"></div>
          </div>
          <div
            class="relative ml-0.5 mt-1.5 inline-block h-[25px] w-[86px] cursor-pointer"
            id="cells-dropdown"
          >
            <button
              class="h-full w-full cursor-not-allowed border border-gray-400 p-0 text-xs opacity-50"
              id="cells"
              disabled
            ></button>
            <div
              class="absolute top-8 text-xs"
              id="cells-dropdowncontent"
            ></div>
          </div>
        </div>
        <div class="ml-1.5 flex">
          <button
            class="mt-[5px] flex h-[25px] min-w-0 cursor-not-allowed items-center justify-center border border-gray-400 px-[8px] py-0 text-xs text-white opacity-50"
            id="x"
            disabled
          >
            x
          </button>
          <button
            class="mt-[5px] flex h-[25px] min-w-0 cursor-not-allowed items-center justify-center border border-gray-400 px-[8px] py-0 text-xs text-white opacity-50"
            id="bank"
            disabled
          >
            Bank
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    class="flex min-h-screen flex-col items-center justify-center"
    id="loader-container"
  >
    <div
      class="flex h-4 w-full max-w-md overflow-hidden rounded-md bg-neutral-700"
    >
      <div
        class="flex w-0 flex-col justify-center overflow-hidden whitespace-nowrap rounded-full bg-blue-600 text-center text-xs text-white transition duration-500"
        id="progress-bar"
      >
        0%
      </div>
    </div>
  </div>

  <div class="invisible opacity-0" id="game-container">
    <embed
      id="swf"
      src="../../assets/loader.swf"
      class="absolute left-0 top-0 h-full w-full"
    />
  </div>
</main>
