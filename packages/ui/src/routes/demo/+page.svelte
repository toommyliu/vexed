<script>
    import {
        Group,
        GroupSeparator,
        GroupText,
        Empty,
        EmptyHeader,
        EmptyMedia,
        EmptyTitle,
        EmptyDescription,
        EmptyContent,
        Tabs,
        TabsList,
        TabsTrigger,
        TabsContent,
        Menu,
        MenuTrigger,
        MenuContent,
        MenuItem,
        MenuSeparator,
        MenuLabel,
        Alert,
        AlertTitle,
        AlertDescription,
        Switch,
        NumberField,
        NumberFieldInput,
        NumberFieldIncrement,
        NumberFieldDecrement,
        NumberFieldGroup,
        Button,
        Input,
        Checkbox,
        Select,
        SelectTrigger,
        SelectContent,
        SelectItem,
        SelectValue,
        SelectGroup,
        SelectGroupLabel,
        SelectSeparator,
        Badge,
        Kbd,
        Label,
        Card,
        CardHeader,
        CardFooter,
        CardTitle,
        CardDescription,
        CardContent,
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

    let switchChecked = $state(false);
    let switchUnchecked = $state(false);
    let numberValue = $state(10);
    let tabValue = $state("account");
    let isDark = $state(false);
    let inputValue = $state("");
    let selectValue = $state("");

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
    class="p-8 space-y-12 min-h-screen bg-background text-foreground transition-colors duration-300"
>
    <div class="flex items-center justify-between max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold">UI Components Demo</h1>
        <Button variant="outline" onclick={toggleDarkMode}>
            {isDark ? "Light Mode" : "Dark Mode"}
        </Button>
    </div>

    <div class="space-y-12 max-w-4xl mx-auto">
        <!-- Button -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Button</h2>
            <div class="space-y-4">
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Variants
                    </h3>
                    <div class="flex gap-2 flex-wrap">
                        <Button variant="default">Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="destructive-outline"
                            >Destructive Outline</Button
                        >
                        <Button variant="success">Success</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                    </div>
                </div>
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Sizes
                    </h3>
                    <div class="flex gap-2 flex-wrap items-center">
                        <Button size="sm">Small</Button>
                        <Button size="default">Default</Button>
                        <Button size="lg">Large</Button>
                        <Button size="icon">icon</Button>
                    </div>
                </div>
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        States
                    </h3>
                    <div class="flex gap-2 flex-wrap">
                        <Button disabled>Disabled</Button>
                        <Button variant="secondary" disabled
                            >Disabled Secondary</Button
                        >
                        <Button variant="outline" disabled
                            >Disabled Outline</Button
                        >
                    </div>
                </div>
            </div>
        </section>

        <!-- Badge -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Badge</h2>
            <div class="space-y-4">
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Variants
                    </h3>
                    <div class="flex gap-2 flex-wrap">
                        <Badge variant="default">Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                    </div>
                </div>
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Sizes
                    </h3>
                    <div class="flex gap-2 flex-wrap items-center">
                        <Badge size="sm">Small</Badge>
                        <Badge size="default">Default</Badge>
                        <Badge size="lg">Large</Badge>
                    </div>
                </div>
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Variant × Size Combinations
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <p class="text-xs text-muted-foreground">Default</p>
                            <div class="flex gap-2 items-center">
                                <Badge variant="default" size="sm">Small</Badge>
                                <Badge variant="default" size="default"
                                    >Default</Badge
                                >
                                <Badge variant="default" size="lg">Large</Badge>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <p class="text-xs text-muted-foreground">
                                Secondary
                            </p>
                            <div class="flex gap-2 items-center">
                                <Badge variant="secondary" size="sm"
                                    >Small</Badge
                                >
                                <Badge variant="secondary" size="default"
                                    >Default</Badge
                                >
                                <Badge variant="secondary" size="lg"
                                    >Large</Badge
                                >
                            </div>
                        </div>
                        <div class="space-y-2">
                            <p class="text-xs text-muted-foreground">Outline</p>
                            <div class="flex gap-2 items-center">
                                <Badge variant="outline" size="sm">Small</Badge>
                                <Badge variant="outline" size="default"
                                    >Default</Badge
                                >
                                <Badge variant="outline" size="lg">Large</Badge>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <p class="text-xs text-muted-foreground">
                                Destructive
                            </p>
                            <div class="flex gap-2 items-center">
                                <Badge variant="destructive" size="sm"
                                    >Small</Badge
                                >
                                <Badge variant="destructive" size="default"
                                    >Default</Badge
                                >
                                <Badge variant="destructive" size="lg"
                                    >Large</Badge
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Alert -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Alert</h2>
            <div class="space-y-4">
                <Alert>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-terminal h-4 w-4"
                        ><polyline points="4 17 10 11" /><line
                            x1="12"
                            x2="20"
                            y1="19"
                            y2="19"
                        /></svg
                    >
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                        You can add components to your app using the cli.
                    </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-alert-circle h-4 w-4"
                        ><circle cx="12" cy="12" r="10" /><line
                            x1="12"
                            x2="12"
                            y1="8"
                            y2="12"
                        /><line x1="12" x2="12.01" y1="16" y2="16" /></svg
                    >
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Your session has expired. Please log in again.
                    </AlertDescription>
                </Alert>
            </div>
        </section>

        <!-- Input & Label -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Input & Label</h2>
            <div class="space-y-4">
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Sizes
                    </h3>
                    <div
                        class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl"
                    >
                        <div class="space-y-1.5">
                            <Label for="input-sm">Small</Label>
                            <Input
                                id="input-sm"
                                size="sm"
                                placeholder="Small input"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <Label for="input-default">Default</Label>
                            <Input
                                id="input-default"
                                size="default"
                                placeholder="Default input"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <Label for="input-lg">Large</Label>
                            <Input
                                id="input-lg"
                                size="lg"
                                placeholder="Large input"
                            />
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Types & States
                    </h3>
                    <div class="grid w-full max-w-sm items-center gap-4">
                        <div class="grid w-full max-w-sm items-center gap-1.5">
                            <Label for="email">Email</Label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="Email"
                                bind:value={inputValue}
                            />
                        </div>
                        <div class="grid w-full max-w-sm items-center gap-1.5">
                            <Label for="password">Password</Label>
                            <Input
                                type="password"
                                id="password"
                                placeholder="Password"
                            />
                        </div>
                        <div class="grid w-full max-w-sm items-center gap-1.5">
                            <Label for="disabled">Disabled</Label>
                            <Input
                                disabled
                                type="text"
                                id="disabled"
                                placeholder="Disabled input"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Checkbox -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Checkbox</h2>
            <div class="space-y-4">
                <div class="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label for="terms">Accept terms and conditions</Label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox id="disabled-checkbox" disabled checked />
                    <Label for="disabled-checkbox">Disabled checked</Label>
                </div>
            </div>
        </section>

        <!-- Select -->
        <section class="space-y-6">
            <h2 class="text-2xl font-semibold border-b pb-2">Select</h2>

            <!-- Size Variants -->
            <div class="space-y-4">
                <h3 class="text-lg font-medium">Size Variants</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="space-y-2">
                        <Label>Small</Label>
                        <Select bind:value={selectValue} class="w-full">
                            <SelectTrigger size="sm">
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sm1"
                                    >Small Option 1</SelectItem
                                >
                                <SelectItem value="sm2"
                                    >Small Option 2</SelectItem
                                >
                                <SelectItem value="sm3"
                                    >Small Option 3</SelectItem
                                >
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="space-y-2">
                        <Label>Default</Label>
                        <Select bind:value={selectValue} class="w-full">
                            <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="def1"
                                    >Default Option 1</SelectItem
                                >
                                <SelectItem value="def2"
                                    >Default Option 2</SelectItem
                                >
                                <SelectItem value="def3"
                                    >Default Option 3</SelectItem
                                >
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="space-y-2">
                        <Label>Large</Label>
                        <Select bind:value={selectValue} class="w-full">
                            <SelectTrigger size="lg">
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lg1"
                                    >Large Option 1</SelectItem
                                >
                                <SelectItem value="lg2"
                                    >Large Option 2</SelectItem
                                >
                                <SelectItem value="lg3"
                                    >Large Option 3</SelectItem
                                >
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <!-- Groups and Separators -->
            <div class="space-y-2">
                <Label>With Groups & Separators</Label>
                <Select bind:value={selectValue} class="max-w-[280px]">
                    <SelectTrigger>
                        <SelectValue placeholder="Select a fruit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectGroupLabel>Fruits</SelectGroupLabel>
                            <SelectItem value="apple">Apple</SelectItem>
                            <SelectItem value="banana">Banana</SelectItem>
                            <SelectItem value="blueberry">Blueberry</SelectItem>
                            <SelectItem value="grapes">Grapes</SelectItem>
                            <SelectItem value="pineapple">Pineapple</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectGroupLabel>Vegetables</SelectGroupLabel>
                            <SelectItem value="aubergine">Aubergine</SelectItem>
                            <SelectItem value="broccoli">Broccoli</SelectItem>
                            <SelectItem value="carrot" disabled
                                >Carrot (Disabled)</SelectItem
                            >
                            <SelectItem value="courgette">Courgette</SelectItem>
                            <SelectItem value="leek">Leek</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <p class="text-sm text-muted-foreground">
                    Selected: {selectValue || "None"}
                </p>
            </div>

            <!-- Long List with Scroll -->
            <div class="space-y-2">
                <Label>Long List (with Scroll Arrows)</Label>
                <Select class="max-w-[280px]">
                    <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="mx">Mexico</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="it">Italy</SelectItem>
                        <SelectItem value="es">Spain</SelectItem>
                        <SelectItem value="jp">Japan</SelectItem>
                        <SelectItem value="cn">China</SelectItem>
                        <SelectItem value="in">India</SelectItem>
                        <SelectItem value="br">Brazil</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                        <SelectItem value="za">South Africa</SelectItem>
                        <SelectItem value="ru">Russia</SelectItem>
                        <SelectItem value="kr">South Korea</SelectItem>
                        <SelectItem value="sg">Singapore</SelectItem>
                        <SelectItem value="nz">New Zealand</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <!-- Disabled State -->
            <div class="space-y-2">
                <Label>Disabled Select</Label>
                <Select disabled class="max-w-[280px]">
                    <SelectTrigger>
                        <SelectValue placeholder="Disabled select" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="disabled1">Option 1</SelectItem>
                        <SelectItem value="disabled2">Option 2</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </section>

        <!-- Switch -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Switch</h2>
            <div class="flex gap-8">
                <div class="flex items-center gap-2">
                    <Switch bind:checked={switchChecked} id="airplane-mode" />
                    <Label for="airplane-mode">Airplane Mode</Label>
                </div>
                <div class="flex items-center gap-2">
                    <Switch disabled checked id="disabled-switch" />
                    <Label for="disabled-switch">Disabled</Label>
                </div>
            </div>
        </section>

        <!-- NumberField -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">NumberField</h2>
            <div class="space-y-4">
                <div class="space-y-2">
                    <Label>Default (0-100)</Label>
                    <NumberField
                        bind:value={numberValue}
                        min={0}
                        max={100}
                        class="w-[150px]"
                    >
                        <NumberFieldGroup>
                            <NumberFieldInput />
                            <NumberFieldIncrement />
                            <NumberFieldDecrement />
                        </NumberFieldGroup>
                    </NumberField>
                </div>
                <div class="space-y-2">
                    <Label>Step 0.5</Label>
                    <NumberField value={1.5} step={0.5} class="w-[150px]">
                        <NumberFieldGroup>
                            <NumberFieldInput />
                            <NumberFieldIncrement />
                            <NumberFieldDecrement />
                        </NumberFieldGroup>
                    </NumberField>
                </div>
            </div>
        </section>

        <!-- Tabs -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Tabs</h2>
            <Tabs bind:value={tabValue} class="w-[400px]">
                <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                            <CardDescription
                                >Make changes to your account here.</CardDescription
                            >
                        </CardHeader>
                        <CardContent class="space-y-2">
                            <div class="space-y-1">
                                <Label for="name">Name</Label>
                                <Input id="name" value="Pedro Duarte" />
                            </div>
                            <div class="space-y-1">
                                <Label for="username">Username</Label>
                                <Input id="username" value="@peduarte" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Save changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="password">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription
                                >Change your password here.</CardDescription
                            >
                        </CardHeader>
                        <CardContent class="space-y-2">
                            <div class="space-y-1">
                                <Label for="current">Current password</Label>
                                <Input id="current" type="password" />
                            </div>
                            <div class="space-y-1">
                                <Label for="new">New password</Label>
                                <Input id="new" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Save password</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </section>

        <!-- Menu -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Menu</h2>
            <Menu>
                <MenuTrigger>
                    <Button variant="outline">Open Menu</Button>
                </MenuTrigger>
                <MenuContent>
                    <MenuLabel>My Account</MenuLabel>
                    <MenuSeparator />
                    <MenuItem>Profile</MenuItem>
                    <MenuItem>Billing</MenuItem>
                    <MenuItem>Team</MenuItem>
                    <MenuItem>Subscription</MenuItem>
                    <MenuSeparator />
                    <MenuItem disabled>Disabled Item</MenuItem>
                    <MenuSeparator />
                    <MenuItem class="text-destructive">Log out</MenuItem>
                </MenuContent>
            </Menu>
        </section>

        <!-- Group -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Group</h2>
            <div class="space-y-4">
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Horizontal
                    </h3>
                    <Group>
                        <GroupText>Item 1</GroupText>
                        <GroupSeparator />
                        <GroupText>Item 2</GroupText>
                        <GroupSeparator />
                        <GroupText>Item 3</GroupText>
                    </Group>
                </div>
                <div class="space-y-2">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Vertical
                    </h3>
                    <Group orientation="vertical">
                        <GroupText>Item 1</GroupText>
                        <GroupSeparator orientation="horizontal" />
                        <GroupText>Item 2</GroupText>
                        <GroupSeparator orientation="horizontal" />
                        <GroupText>Item 3</GroupText>
                    </Group>
                </div>
            </div>
        </section>

        <!-- Empty -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Empty</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div class="border rounded-md p-4">
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia>
                                <div
                                    class="w-12 h-12 bg-muted rounded-full flex items-center justify-center"
                                >
                                    📦
                                </div>
                            </EmptyMedia>
                            <EmptyTitle>No items found</EmptyTitle>
                            <EmptyDescription>
                                You haven't added any items yet.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button>Create Item</Button>
                        </EmptyContent>
                    </Empty>
                </div>
                <div class="border rounded-md p-4">
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-search"
                                    ><circle cx="11" cy="11" r="8" /><path
                                        d="m21 21-4.3-4.3"
                                    /></svg
                                >
                            </EmptyMedia>
                            <EmptyTitle>No results</EmptyTitle>
                            <EmptyDescription>
                                We couldn't find any results for your search.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                </div>
            </div>
        </section>

        <!-- Kbd -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Kbd</h2>
            <div class="flex gap-4 items-center">
                <p class="text-sm text-muted-foreground">
                    Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to search.
                </p>
                <p class="text-sm text-muted-foreground">
                    Press <Kbd>Ctrl</Kbd> + <Kbd>C</Kbd> to copy.
                </p>
            </div>
        </section>

        <!-- Card -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Card</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Create project</CardTitle>
                        <CardDescription
                            >Deploy your new project in one-click.</CardDescription
                        >
                    </CardHeader>
                    <CardContent>
                        <div class="grid w-full items-center gap-4">
                            <div class="flex flex-col space-y-1.5">
                                <Label for="project-name">Name</Label>
                                <Input
                                    id="project-name"
                                    placeholder="Name of your project"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter class="flex justify-between">
                        <Button variant="outline">Cancel</Button>
                        <Button>Deploy</Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription
                            >You have 3 unread messages.</CardDescription
                        >
                    </CardHeader>
                    <CardContent>
                        <div
                            class="flex items-center space-x-4 rounded-md border p-4"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="lucide lucide-bell h-6 w-6"
                                ><path
                                    d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
                                /><path
                                    d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
                                /></svg
                            >
                            <div class="flex-1 space-y-1">
                                <p class="text-sm font-medium leading-none">
                                    Push Notifications
                                </p>
                                <p class="text-sm text-muted-foreground">
                                    Send notifications to device.
                                </p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        <!-- Dialog -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold border-b pb-2">Dialog</h2>
            <Dialog>
                <DialogTrigger>
                    <Button>Edit Profile</Button>
                </DialogTrigger>
                <DialogContent class="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when
                            you're done.
                            <div class="grid gap-4 py-4">
                                <div
                                    class="grid grid-cols-4 items-center gap-4"
                                >
                                    <Label for="dialog-name" class="text-right"
                                        >Name</Label
                                    >
                                    <Input
                                        id="dialog-name"
                                        value="Pedro Duarte"
                                        class="col-span-3"
                                    />
                                </div>
                                <div
                                    class="grid grid-cols-4 items-center gap-4"
                                >
                                    <Label
                                        for="dialog-username"
                                        class="text-right">Username</Label
                                    >
                                    <Input
                                        id="dialog-username"
                                        value="@peduarte"
                                        class="col-span-3"
                                    />
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    </div>
</div>
