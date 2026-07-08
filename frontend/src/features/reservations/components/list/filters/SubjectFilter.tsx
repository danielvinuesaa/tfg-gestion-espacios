import React from 'react';
import { Autocomplete, TextField, Chip, Box, Typography, Link, Checkbox } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type { Subject } from '../../../../../shared/types';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

/**
 * Propiedades del componente SubjectFilter.
 */
interface SubjectFilterProps {
    allSubjects: Subject[];
    selectedSubjectIds: string[];
    onChange: (ids: string[]) => void;
}

/**
 * Componente secundario para la selección de filtros enfocados en asignaturas académicas.
 * 
 * Se encarga de mostrar un listado de selección múltiple (Autocomplete) donde las asignaturas 
 * se encuentran agrupadas lógicamente según su curso académico. Al igual que el filtro de espacios, 
 * incorpora capacidades para marcar o desmarcar el conjunto total de asignaturas de un mismo curso 
 * con un solo clic.
 * 
 * @param props - Propiedades del componente.
 * @param props.allSubjects - Colección integral de las asignaturas presentes en el plan de estudios.
 * @param props.selectedSubjectIds - Array de identificadores correspondientes a las asignaturas filtradas.
 * @param props.onChange - Callback disparado al efectuar un cambio en la selección.
 * @returns Elemento React con el selector agrupado de asignaturas.
 */
const SubjectFilter = ({ allSubjects, selectedSubjectIds, onChange }: SubjectFilterProps) => {
    const sortedSubjects = [...allSubjects].sort((a, b) => {
        if (a.course !== b.course) return Number(a.course) - Number(b.course);
        return a.name.localeCompare(b.name);
    });

    const handleSelectCourse = (subjectsInCourse: Subject[]) => {
        const courseIds = subjectsInCourse.map(s => s.id.toString());
        const selectedInCourse = selectedSubjectIds.filter(id => courseIds.includes(id));
        const isAllSelected = selectedInCourse.length === courseIds.length;

        let newIds: string[];
        if (isAllSelected) {
            newIds = selectedSubjectIds.filter(id => !courseIds.includes(id));
        } else {
            newIds = Array.from(new Set([...selectedSubjectIds, ...courseIds]));
        }
        onChange(newIds);
    };

    return (
        <Autocomplete
            multiple size="small" disableCloseOnSelect limitTags={1} options={sortedSubjects}
            groupBy={(option) => `Curso ${option.course}`}
            getOptionLabel={(option) => `[${option.code}] ${option.name}`}
            value={allSubjects.filter(s => selectedSubjectIds.includes(s.id.toString()))}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_e, val) => onChange(val.map(v => v.id.toString()))}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                    <Chip label={option.code} size="small" {...getTagProps({ index })} key={option.id} />
                ))
            }
            renderInput={(params) => (
                <TextField {...params} label="Asignaturas" placeholder={selectedSubjectIds.length === 0 ? "Añadir asignatura..." : ""} sx={{ bgcolor: 'white' }} />
            )}
            renderGroup={(params) => {
                const courseLabel = params.group;
                const courseValue = courseLabel.replace('Curso ', '');
                const subjectsInCourse = allSubjects.filter(s => String(s.course) === courseValue);
                const selectedInCourse = selectedSubjectIds.filter(id => subjectsInCourse.some(sc => sc.id.toString() === id));
                const isAllSelected = selectedInCourse.length === subjectsInCourse.length;

                return (
                    <Box key={params.key}>
                        <Box sx={{ 
                            px: 2, py: 0.5, display: 'flex', justifyContent: 'space-between', 
                            alignItems: 'center', bgcolor: '#f0f4f8', position: 'sticky', top: 0, zIndex: 1,
                            borderBottom: '1px solid #e0e0e0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <Typography variant="overline" fontWeight="800" color="primary.dark">{params.group.toUpperCase()}</Typography>
                            <Link component="button" variant="caption" onClick={() => handleSelectCourse(subjectsInCourse)} sx={{ textDecoration: 'none', fontWeight: 'bold' }}>
                                {isAllSelected ? 'DESMARCAR CURSO' : 'MARCAR CURSO'}
                            </Link>
                        </Box>
                        <Box sx={{ py: 0.5 }}>{params.children}</Box>
                    </Box>
                );
            }}
            renderOption={(props, option, { selected }) => {
                const { key, ...otherProps } = props as any;
                return (
                    <Box component="li" key={key} {...otherProps} sx={{ px: 2, py: 0.5 }}>
                        <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight={selected ? "bold" : "medium"}>{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">Código: {option.code}</Typography>
                        </Box>
                    </Box>
                );
            }}
        />
    );
};

export default SubjectFilter;
