
export const trimTeamName = (name: string): string => {
    return name
        .toLowerCase()
        .split(" ")
        .filter(word => word !== "fc" && word !== "cf")
        .join(" ");
};

export const removeAccents = (str: string): string => {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};
