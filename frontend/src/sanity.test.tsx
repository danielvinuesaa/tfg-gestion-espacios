import { describe, it, expect } from 'vitest';
import { render, screen } from './test/test-utils';
import React from 'react';

/**
 * Suite de pruebas de sanidad y configuración básica.
 * Verifica que el entorno de pruebas, los proveedores base y
 * la librería de testing-library estén funcionando correctamente.
 */
describe('Frontend Infrastructure Test', () => {
  /**
   * Verifica que se puede renderizar un componente simple
   * rodeado de los proveedores globales de la aplicación sin arrojar errores.
   */
  it('should render with all providers without crashing', () => {
    render(<div>Base Infrastructure OK</div>);
    expect(screen.getByText('Base Infrastructure OK')).toBeInTheDocument();
  });
});
