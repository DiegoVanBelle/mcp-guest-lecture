import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

const API_BASE_URL = process.env.UNIVERSITY_API_URL || 'http://localhost:4000';

const server = new McpServer({
  name: 'university-it-support',
  version: '1.0.0'
});

async function callApi(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `University API returned HTTP ${response.status}`);
  }
  return body;
}

function result(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}

function toolError(error) {
  return {
    isError: true,
    content: [{ type: 'text', text: `University IT API error: ${error.message}` }]
  };
}

server.registerTool(
  'get_student',
  {
    title: 'Get student',
    description: 'Retrieve university student information using a student ID. Use this to verify the student before working with their devices or support request.',
    inputSchema: z.object({
      student_id: z.string().min(1).describe('University student ID, for example 12345')
    })
  },
  async ({ student_id }) => {
    try {
      return result(await callApi(`/students/${encodeURIComponent(student_id)}`));
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  'get_student_devices',
  {
    title: 'Get student devices',
    description: 'Retrieve IT devices assigned to a university student. Use this when a support issue concerns university hardware and the correct device must be identified.',
    inputSchema: z.object({
      student_id: z.string().min(1).describe('University student ID, for example 12345')
    })
  },
  async ({ student_id }) => {
    try {
      return result({ student_id, devices: await callApi(`/devices/${encodeURIComponent(student_id)}`) });
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  'create_support_ticket',
  {
    title: 'Create IT support ticket',
    description: 'Create a university IT support ticket for a student and one of their assigned devices. Only call this after the student and relevant device are known.',
    inputSchema: z.object({
      student_id: z.string().min(1).describe('University student ID'),
      device_id: z.string().min(1).describe('Assigned university device ID, for example DEV-2048'),
      issue: z.string().min(3).describe('Clear description of the IT problem reported by the student'),
      priority: z.enum(['Low', 'Medium', 'High']).describe('Support priority based on the reported impact'),
      category: z.enum(['Hardware', 'Software', 'Network & Wi-Fi', 'Account & Access', 'Other']).optional().describe('Optional support category')
    })
   },
  async ({ student_id, device_id, issue, priority, category }) => {
    try {
      const ticket = await callApi('/tickets', {
        method: 'POST',
        body: JSON.stringify({ student_id, device_id, issue, priority, category: category || 'Other' })
      });
      return result({
        message: `IT support ticket #${ticket.id} was created successfully.`,
        ticket
      });
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  'get_tickets',
  {
    title: 'Get all tickets',
    description: 'Get all support tickets',
  },
  async ({}) => {
    try {
      return result({ tickets: await callApi('/tickets') });
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  'update_support_ticket',
  {
    title: 'Update IT support ticket',
    description:
      'Update an existing university IT support ticket. Use this when the user wants to change the issue description, priority, category or status of an existing ticket.',

    inputSchema: z.object({
      ticket_id: z
        .number()
        .int()
        .describe('Existing IT support ticket number, for example 4812'),

      issue: z
        .string()
        .min(3)
        .optional()
        .describe('Updated description of the IT problem'),

      priority: z
        .enum(['Low', 'Medium', 'High'])
        .optional()
        .describe('Updated ticket priority'),

      category: z
        .enum([
          'Hardware',
          'Software',
          'Network & Wi-Fi',
          'Account & Access',
          'Other'
        ])
        .optional()
        .describe('Updated support category'),

      status: z
        .enum(['Open', 'In Progress', 'Resolved'])
        .optional()
        .describe('Updated ticket status')
    })
  },

  async ({
    ticket_id,
    issue,
    priority,
    category,
    status
  }) => {
    try {
      const updates = {};

      if (issue !== undefined) {
        updates.issue = issue;
      }

      if (priority !== undefined) {
        updates.priority = priority;
      }

      if (category !== undefined) {
        updates.category = category;
      }

      if (status !== undefined) {
        updates.status = status;
      }

      if (Object.keys(updates).length === 0) {
        return toolError(
          new Error('At least one ticket field must be updated.')
        );
      }

      const ticket = await callApi(
        `/tickets/${encodeURIComponent(ticket_id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates)
        }
      );

      return result({
        message: `IT support ticket #${ticket.id} was updated successfully.`,
        ticket
      });
    } catch (error) {
      return toolError(error);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`University IT MCP server connected (REST API: ${API_BASE_URL})`);
}

main().catch((error) => {
  console.error('MCP server failed:', error);
  process.exit(1);
});
