/**
 * Acciones que dispara la landing. Los componentes no navegan por su cuenta:
 * quien los monta (App) decide qué hace cada una.
 *
 * - ANALYZE: abrir el asistente para analizar un mensaje (momento "antes").
 * - DURING_CALL: abrir el asistente en el flujo de contención (momento "durante").
 * - SOS: abrir el protocolo de auxilio (momento "después").
 * - RADAR: ir al Radar Comunitario.
 */
export type LandingAction = 'ANALYZE' | 'DURING_CALL' | 'SOS' | 'RADAR';

export interface LandingProps {
  onAction: (action: LandingAction) => void;
}
