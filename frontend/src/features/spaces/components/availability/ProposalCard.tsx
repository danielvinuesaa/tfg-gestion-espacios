import { 
    Fade, Badge, Card, CardContent, Box, Avatar, Typography, 
    Divider, Stack, Chip, CardActions, Button, LinearProgress 
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import { formatDisplayDate, parseApiDate } from '../../../../shared/utils/dateUtils';
import type { ReservationProposal } from '../../hooks/useAvailabilitySearch';

/**
 * Propiedades para el componente ProposalCard.
 */
interface ProposalCardProps {
    /** Información de la propuesta de reserva a visualizar. */
    proposal: ReservationProposal;
    /** Índice de la propuesta en la lista de resultados, usado para el orden. */
    index: number;
    /** Filtros utilizados en la búsqueda, para calcular la eficiencia. */
    filters: any;
    /** Función a ejecutar al hacer clic en el botón de solicitar. */
    onSelect: (p: ReservationProposal) => void;
    /** Indica si la tarjeta está actualmente seleccionada. */
    isSelected?: boolean;
    /** Función opcional a ejecutar al hacer clic sobre la tarjeta completa. */
    onCardClick?: () => void;
}

/**
 * Componente que muestra una tarjeta con la información detallada de una propuesta de reserva.
 * Renderiza el aforo físico y efectivo, calcula el porcentaje de eficiencia de uso
 * en base a los asistentes esperados, y muestra las recomendaciones generadas por el sistema.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que representa la tarjeta de la propuesta.
 */
const ProposalCard = ({ proposal, index, filters, onSelect, isSelected = false, onCardClick }: ProposalCardProps) => {
    // Cálculo de eficiencia para la barra visual (Basado en aforo efectivo)
    const requestedStudents = filters.minCapacity ? parseInt(filters.minCapacity) : 1;
    const efficiencyPercent = Math.min(Math.round((requestedStudents / proposal.effectiveCapacity) * 100), 100);
    
    const hasSeparation = filters.distributionRatio > 1;

    // Determinar color según eficiencia (Lógica de semáforo)
    const getEfficiencyColor = () => {
        if (efficiencyPercent >= 75) return 'success'; // Verde: Muy eficiente
        if (efficiencyPercent >= 40) return 'warning'; // Amarillo: Aceptable
        return 'error'; // Rojo: Despilfarro de espacio
    };

    return (
        <Fade in timeout={300 + index * 100}>
            <Badge 
                badgeContent={index === 0 ? "RECOMENDADO" : ""} 
                color="primary"
                invisible={index !== 0}
                sx={{ 
                    width: '100%',
                    '& .MuiBadge-badge': { top: 20, right: 40, height: 24, fontSize: '0.7rem', fontWeight: 'bold' } 
                }}
            >
                <Card 
                    onClick={onCardClick}
                    sx={{ 
                        borderRadius: 4, width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #1a73e8' : '1px solid #eee',
                        boxShadow: isSelected ? '0 8px 30px rgba(26,115,232,0.15)' : 'none',
                        transform: isSelected ? 'scale(1.02)' : 'none',
                        transition: 'all 0.2s', 
                        '&:hover': { 
                            transform: isSelected ? 'scale(1.02)' : 'translateY(-4px)',
                            borderColor: isSelected ? '#1a73e8' : '#ccc'
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Avatar sx={{ 
                                bgcolor: isSelected ? '#1a73e8' : '#f1f3f4', 
                                color: isSelected ? '#fff' : '#5f6368',
                                width: 32, height: 32
                            }}>
                                {index === 0 ? <AutoAwesomeIcon fontSize="small" /> : <MeetingRoomIcon fontSize="small" />}
                            </Avatar>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                OPCIÓN {index + 1}
                            </Typography>
                        </Box>

                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {proposal.spaces.length === 1 ? proposal.spaces[0].name : "Combinación de Salas"}
                        </Typography>

                        {(proposal.suggestedStartTime || filters.startTime) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                                <AccessTimeIcon sx={{ fontSize: 18 }} />
                                <Typography variant="body2" fontWeight="bold">
                                    {formatDisplayDate(parseApiDate(proposal.suggestedStartTime || filters.startTime!), "EEEE d 'de' MMMM")}
                                </Typography>
                            </Box>
                        )}
                        {(proposal.suggestedStartTime && proposal.suggestedEndTime) && (
                            <Typography variant="caption" sx={{ display: 'block', mb: 2, bgcolor: '#f0f7ff', p: 0.5, borderRadius: 1, width: 'fit-content' }}>
                                Horario: {formatDisplayDate(parseApiDate(proposal.suggestedStartTime), "HH:mm")} - {formatDisplayDate(parseApiDate(proposal.suggestedEndTime), "HH:mm")}
                            </Typography>
                        )}

                        <Box sx={{ mt: 2, mb: 3 }}>
                            {proposal.spaces.map((s) => (
                                <Chip 
                                    key={s.id} label={s.name} size="small"
                                    sx={{ mr: 0.5, mb: 0.5, bgcolor: '#e8f0fe', color: '#1967d2', fontWeight: 600 }}
                                />
                            ))}
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Capacidad Física:</Typography>
                                <Typography variant="body2" fontWeight="bold">{proposal.totalCapacity} personas</Typography>
                            </Box>

                            {hasSeparation && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Aforo Efectivo:</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="primary.main">{proposal.effectiveCapacity} personas</Typography>
                                </Box>
                            )}
                            
                            {/* Nueva Sección de Eficiencia Visual */}
                            <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <SpeedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                            Eficiencia de Uso
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" fontWeight="bold" color={getEfficiencyColor() + '.main'}>
                                        {efficiencyPercent}% ({Math.max(0, Math.round(proposal.effectiveCapacity - requestedStudents))} libres)
                                    </Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={efficiencyPercent} 
                                    color={getEfficiencyColor()}
                                    sx={{ height: 6, borderRadius: 3, bgcolor: '#eee' }}
                                />
                            </Box>

                            <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 1, fontWeight: 500 }}>
                                ✨ {proposal.recommendationReason}
                            </Typography>
                        </Stack>
                    </CardContent>
                    <CardActions sx={{ p: 2, bgcolor: isSelected ? '#f8faff' : 'transparent' }}>
                        <Button 
                            fullWidth variant={isSelected ? "contained" : "outlined"}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(proposal);
                            }}
                            sx={{ borderRadius: 2, fontWeight: 'bold' }}
                        >
                            Solicitar esta opción
                        </Button>
                    </CardActions>
                </Card>
            </Badge>
        </Fade>
    );
};

export default ProposalCard;
