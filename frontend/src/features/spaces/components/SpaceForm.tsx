import { useState } from 'react';
import type { Space, SpaceType, SpaceStatus } from '../../../shared/types';
import { useSpaceForm } from '../hooks/useSpaceForm';
import {
    TextField,
    MenuItem,
    Grid,
    Box,
    Tooltip,
    InputAdornment,
    Typography,
    Divider
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import ComputerIcon from '@mui/icons-material/Computer';
import MapIcon from '@mui/icons-material/Map';
import TitleIcon from '@mui/icons-material/Title';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import FormDialogWrapper from '../../../shared/components/FormDialogWrapper';

/**
 * Propiedades para el componente SpaceForm.
 */
interface SpaceFormProps {
    /** Indica si el formulario/diálogo debe mostrarse abierto. */
    open: boolean;
    /** Función a ejecutar para cerrar el diálogo. */
    handleClose: () => void;
    /** 
     * Función a ejecutar tras guardar correctamente el espacio.
     * @param message - Mensaje opcional de éxito.
     */
    onSuccess: (message?: string) => void;
    /** Datos iniciales del espacio, si se va a editar. Nulo para crear uno nuevo. */
    initialData?: Space | null;
}

const SPACE_TYPES: SpaceType[] = ['AULA', 'LABORATORIO', 'DESPACHO', 'SALA_ESTUDIO', 'SALON_ACTOS', 'OTROS'];
const SPACE_STATUSES: SpaceStatus[] = ['DISPONIBLE', 'ELIMINADO'];

/**
 * Formulario profesional de gestión de espacios.
 * Emplea FormDialogWrapper para presentar un diálogo coherente y maneja la
 * lógica de campos, validaciones y peticiones al backend para crear o editar espacios.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con el formulario de gestión.
 */
const SpaceForm = ({ open, handleClose, onSuccess, initialData }: SpaceFormProps) => {
    const {
        formData, loading, error, isDirty,
        handleChange, saveSpace, getFieldError,
        touched, handleBlur
    } = useSpaceForm(initialData, open, handleClose, onSuccess);

    const isEdit = initialData && typeof initialData === 'object' && 'id' in initialData;

    // -- Validaciones Visuales --
    const nameError = getFieldError('name') || (touched.name && !formData.name?.trim() ? "El nombre es obligatorio" : "");
    const typeError = getFieldError('type') || (touched.type && !formData.type ? "El tipo es obligatorio" : "");
    const capacityError = getFieldError('totalCapacity') || (touched.totalCapacity && (!formData.totalCapacity || formData.totalCapacity < 1) ? "La capacidad debe ser al menos 1" : "");

    const isFormValid = !!formData.name?.trim() && !!formData.type && (!!formData.totalCapacity && formData.totalCapacity >= 1);

    return (
        <FormDialogWrapper
            open={open}
            onClose={handleClose}
            title={isEdit ? 'Editar Espacio' : 'Nuevo Espacio'}
            icon={<BusinessIcon />}
            loading={loading}
            error={error}
            isDirty={isDirty}
            isValid={isFormValid}
            onSubmit={saveSpace}
            submitText={isEdit ? 'Guardar Cambios' : 'Crear Espacio'}
        >
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Divider sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Información Básica
                        </Typography>
                    </Divider>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        name="name" label="Nombre del Espacio" fullWidth required
                        value={formData.name} onChange={handleChange} onBlur={() => handleBlur('name')}
                        error={!!nameError} helperText={nameError}
                        placeholder="Ej: Aula 1.1, Laboratorio de Redes..."
                        InputProps={{ startAdornment: (<InputAdornment position="start"><TitleIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        select name="type" label="Tipo de Espacio" fullWidth required
                        value={formData.type} onChange={handleChange} onBlur={() => handleBlur('type')}
                        error={!!typeError} helperText={typeError}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><CategoryIcon fontSize="small" color="action" /></InputAdornment>) }}
                    >
                        {SPACE_TYPES.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                    </TextField>
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Capacidades y Equipamiento
                        </Typography>
                    </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        name="totalCapacity" label="Capacidad Total" type="number" fullWidth required
                        value={formData.totalCapacity} onChange={handleChange} onBlur={() => handleBlur('totalCapacity')}
                        error={!!capacityError} helperText={capacityError}
                        inputProps={{ min: 1 }}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><GroupsIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="computerCount" label="Nº Ordenadores" type="number" fullWidth
                        value={formData.computerCount} onChange={handleChange}
                        error={!!getFieldError('computerCount')} helperText={getFieldError('computerCount')}
                        inputProps={{ min: 0 }}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><ComputerIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Información Geográfica y Adicional
                        </Typography>
                    </Divider>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        name="gisId" label="ID Detalle GIS" fullWidth value={formData.gisId} onChange={handleChange}
                        placeholder="Ej: 12345"
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><MapIcon fontSize="small" color="action" /></InputAdornment>),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Número idDetalle de gis.uniovi.es" arrow placement="top"><InfoIcon fontSize="small" color="disabled" sx={{ cursor: 'help' }} /></Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        name="additionalInfo" label="Información Adicional / Equipamiento" multiline rows={2} fullWidth
                        value={formData.additionalInfo} onChange={handleChange}
                        placeholder="Indique equipamiento especial o notas relevantes..."
                        InputProps={{ startAdornment: (<InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><DescriptionIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                </Grid>
            </Grid>
        </FormDialogWrapper>
    );
};

export default SpaceForm;
