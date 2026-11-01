
export const teamSearchQuery = (...names: (string | undefined)[]): string => {
    const uniqueNames = new Map<string, string>();
    for (const name of names) {
        const value = name?.trim();
        if (value && !uniqueNames.has(value.toLowerCase())) {
            uniqueNames.set(value.toLowerCase(), value);
        }
    }
    return [...uniqueNames.values()].map(value => `"${value}"`).join(' OR ');
};

export const removeAccents = (str: string): string => {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};
