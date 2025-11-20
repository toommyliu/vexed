<script>
    import {
        Button,
        Input,
        Checkbox,
        Select,
        Card,
        CardHeader,
        CardTitle,
        CardDescription,
        CardContent,
        CardFooter,
        Modal,
        Section,
        Tag,
    } from "$lib";
    import { onMount } from "svelte";

    let showModal = false;
    let inputText = "";
    let checkboxChecked = false;
    let selectedOption = "option1";
    let isDark = false;

    const options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
        { value: "option3", label: "Option 3" },
    ];

    function toggleDarkMode() {
        isDark = !isDark;
        if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }

    onMount(() => {
        const theme = localStorage.getItem("theme");
        if (
            theme === "dark" ||
            (!theme &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            isDark = true;
            document.documentElement.classList.add("dark");
        }
    });
</script>

<div
    class="p-8 space-y-8 bg-background min-h-screen text-foreground transition-colors duration-300"
>
    <div class="flex items-center justify-between mb-4">
        <h1 class="text-3xl font-bold">UI Components Demo</h1>
        <Button variant="outline" onclick={toggleDarkMode}>
            {isDark ? "Light Mode" : "Dark Mode"}
        </Button>
    </div>

    <Section title="Buttons">
        <div class="flex gap-4">
            <Button onclick={() => alert("Clicked!")}>Default Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="link">Link Button</Button>
            <Button variant="destructive">Destructive Button</Button>
            <Button variant="destructive-outline"
                >Outline Destructive Button</Button
            >
            <Button disabled>Disabled Button</Button>
        </div>
    </Section>

    <Section title="Form Elements">
        <div class="space-y-4 max-w-md">
            <Input
                label="Text Input"
                placeholder="Type something..."
                bind:value={inputText}
            />
            <p class="text-sm text-gray-500">Value: {inputText}</p>

            <Checkbox label="Checkbox" bind:checked={checkboxChecked} />
            <p class="text-sm text-gray-500">Checked: {checkboxChecked}</p>

            <Select
                label="Select Option"
                {options}
                bind:value={selectedOption}
            />
            <p class="text-sm text-gray-500">Selected: {selectedOption}</p>
        </div>
    </Section>

    <Section title="Layout & Display">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is a card component. It can contain any content.</p>
                </CardContent>
                <CardFooter>
                    <p>Footer content</p>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tags</CardTitle>
                    <CardDescription
                        >Example of tags inside a card</CardDescription
                    >
                </CardHeader>
                <CardContent>
                    <div class="flex gap-2">
                        <Tag>Default</Tag>
                        <Tag variant="primary">Primary</Tag>
                        <Tag variant="secondary">Secondary</Tag>
                    </div>
                </CardContent>
            </Card>
        </div>
    </Section>

    <Section title="Modal">
        <Button onclick={() => (showModal = true)}>Open Modal</Button>

        {#if showModal}
            <Modal onclose={() => (showModal = false)} title="Demo Modal">
                <p>This is a modal dialog.</p>
                <div class="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onclick={() => (showModal = false)}
                        >Cancel</Button
                    >
                    <Button onclick={() => (showModal = false)}>Confirm</Button>
                </div>
            </Modal>
        {/if}
    </Section>
</div>
