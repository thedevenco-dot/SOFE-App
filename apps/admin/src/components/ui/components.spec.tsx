import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormField } from './FormField';
import { Badge } from './Badge';
import { Button } from './Button';
import { DataTable } from './DataTable';
import { ColumnDef } from '@tanstack/react-table';

describe('Admin Core UI Components', () => {
  describe('FormField', () => {
    it('renders label, input, and required asterisk', () => {
      render(
        <FormField label="Email Address" required htmlFor="email-input">
          <input id="email-input" />
        </FormField>,
      );

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByTitle('Required')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders error message with role="alert"', () => {
      render(
        <FormField label="Password" error="Password must be at least 8 characters">
          <input type="password" />
        </FormField>,
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Password must be at least 8 characters');
    });

    it('renders helper text when error is absent', () => {
      render(
        <FormField label="Slug" helperText="Permanent unique identifier">
          <input />
        </FormField>,
      );

      expect(screen.getByText('Permanent unique identifier')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge with correct status styling', () => {
      render(<Badge variant="published">PUBLISHED</Badge>);
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });
  });

  describe('Button', () => {
    it('renders button and responds to click', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Submit</Button>);

      fireEvent.click(screen.getByText('Submit'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading spinner when isLoading is true and disables button', () => {
      render(<Button isLoading>Save</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('DataTable', () => {
    interface TestItem {
      id: string;
      name: string;
      role: string;
    }

    const testColumns: ColumnDef<TestItem>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'role', header: 'Role' },
    ];

    const testData: TestItem[] = [
      { id: '1', name: 'Alice Smith', role: 'Founder' },
      { id: '2', name: 'Bob Jones', role: 'Instructor' },
    ];

    it('renders data rows and column headers', () => {
      render(<DataTable columns={testColumns} data={testData} searchKey="name" />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('renders empty state when data is empty', () => {
      render(
        <DataTable
          columns={testColumns}
          data={[]}
          emptyTitle="No staff members"
          emptyDescription="Add staff members using the invite button."
        />,
      );

      expect(screen.getByText('No staff members')).toBeInTheDocument();
      expect(screen.getByText('Add staff members using the invite button.')).toBeInTheDocument();
    });

    it('filters rows based on search input', () => {
      render(<DataTable columns={testColumns} data={testData} searchKey="name" />);

      const searchInput = screen.getByPlaceholderText('Search records...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    });
  });
});
