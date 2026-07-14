export const logger = (initializer:any) => (set:any, get:any, api:any) =>{
    
    const loggedSet = (...args:any) => {
        const before = get();
        set(...args);
        const after = get();
        console.log("State changed:", { before, after });
    }

    return initializer(loggedSet, get, api)
}