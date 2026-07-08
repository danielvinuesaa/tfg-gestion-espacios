/**
 * Compara dos objetos de forma profunda para determinar si son iguales,
 * ignorando el orden de las claves.
 * 
 * @param obj1 Primer objeto a comparar
 * @param obj2 Segundo objeto a comparar
 * @returns true si los objetos son estructuralmente idénticos
 */
export const areObjectsEqual = (obj1: any, obj2: any): boolean => {
    // Si son la misma instancia o valores primitivos iguales
    if (obj1 === obj2) return true;

    // Si uno es nulo/indefinido y el otro no
    if (!obj1 || !obj2) return obj1 === obj2;

    // Si no son objetos (ej: uno es string y otro número)
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

    // Si son instancias de Date
    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }

    // Si son arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        return obj1.every((val, index) => areObjectsEqual(val, obj2[index]));
    }

    // Si uno es array y el otro no
    if (Array.isArray(obj1) || Array.isArray(obj2)) return false;

    const keys1 = Object.keys(obj1).sort();
    const keys2 = Object.keys(obj2).sort();

    // Si tienen distinto número de propiedades
    if (keys1.length !== keys2.length) return false;

    // Comprobación profunda de cada propiedad
    return keys1.every(key => {
        if (!keys2.includes(key)) return false;
        return areObjectsEqual(obj1[key], obj2[key]);
    });
};
