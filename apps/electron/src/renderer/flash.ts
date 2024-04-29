async function progress([percentage]: [number]) {
	if (percentage === 100) await createRuntime();
}
