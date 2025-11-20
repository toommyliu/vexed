<script>
    import {
        Button,
        Input,
        Checkbox,
        Select,
        SelectTrigger,
        SelectContent,
        SelectItem,
        SelectValue,
        Card,
        CardHeader,
        CardTitle,
        CardDescription,
        CardContent,
        CardFooter,
        Badge,
        Kbd,
        Label,
        Dialog,
        DialogTrigger,
        DialogContent,
        DialogHeader,
        DialogFooter,
        DialogTitle,
        DialogDescription,
        DialogClose,
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

    <Card>
        <CardHeader>
            <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="flex gap-4 flex-wrap">
                <Button onclick={() => alert("Clicked!")}>Default Button</Button
                >
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
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Form Elements</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="space-y-4 max-w-md">
                <Input
                    label="Text Input"
                    placeholder="Type something..."
                    bind:value={inputText}
                />
                <p class="text-sm text-gray-500">Value: {inputText}</p>

                <Checkbox label="Checkbox" bind:checked={checkboxChecked} />
                <p class="text-sm text-gray-500">Checked: {checkboxChecked}</p>

                <div class="space-y-2">
                    <Label>Select Option</Label>
                    <Select bind:value={selectedOption}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {#each options as option}
                                <SelectItem value={option.value}
                                    >{option.label}</SelectItem
                                >
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
                <p class="text-sm text-gray-500">Selected: {selectedOption}</p>
            </div>
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Layout & Display</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card Description</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>
                            This is a card component. It can contain any
                            content.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <p>Footer content</p>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Badges</CardTitle>
                        <CardDescription
                            >Example of badges inside a card</CardDescription
                        >
                    </CardHeader>
                    <CardContent>
                        <div class="flex gap-2 flex-wrap">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge variant="destructive">Destructive</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Typography & Keyboard</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="space-y-4">
                <div class="flex items-center gap-2">
                    <Label>Press</Label>
                    <Kbd>⌘</Kbd>
                    <Label>+</Label>
                    <Kbd>K</Kbd>
                    <Label>to search</Label>
                </div>
            </div>
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Dialog</CardTitle>
        </CardHeader>
        <CardContent>
            <Dialog>
                <DialogTrigger>
                    <Button>Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when
                            you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div class="grid gap-4 py-4 px-6">
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label class="text-right">Name</Label>
                            <Input value="Pedro Duarte" class="col-span-3" />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label class="text-right">Username</Label>
                            <Input value="@peduarte" class="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardContent>
    </Card>
</div>
