console.time("CREATE_START");

export const startInstance = createStart(() => {
    console.timeLog("CREATE_START", "inside createStart");
    return {
        functionMiddleware: [attachSupabaseAuth],
        requestMiddleware: [errorMiddleware],
    };
});

console.timeEnd("CREATE_START");
