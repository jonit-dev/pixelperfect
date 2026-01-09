/**
 * Schema Markup Component
 * Based on PRD-PSEO-04 Section 2.2: Schema Component
 * Renders JSON-LD structured data in the page head
 */

import { ReactElement } from 'react';

interface ISchemaMarkupProps {
  schema: object;
}

export function SchemaMarkup({ schema }: ISchemaMarkupProps): ReactElement {
  return (
    <script
      id="schema-markup"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
