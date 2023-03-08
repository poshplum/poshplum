export const asyncDelay = async (ms) => {
    return new Promise((res) => {
        const t = setTimeout(res, ms);
        if (t.unref) t.unref();
    });
};
