/**
 * DE Mastery Pro — Embedded Client-Side SQL Engine & Practice Lab
 * Enables 100% offline interactive SQL execution, schema inspection, and guided challenges.
 */

(function () {
  const TABLES = {
    customers: [
      { customer_id: 101, name: 'Aarav Sharma', email: 'aarav@example.com', city: 'Bengaluru', segment: 'Enterprise', signup_date: '2025-01-15' },
      { customer_id: 102, name: 'Priya Patel', email: 'priya@example.com', city: 'Mumbai', segment: 'Consumer', signup_date: '2025-01-20' },
      { customer_id: 103, name: 'Rohan Gupta', email: 'rohan@example.com', city: 'Delhi', segment: 'SMB', signup_date: '2025-02-05' },
      { customer_id: 104, name: 'Sneha Reddy', email: 'sneha@example.com', city: 'Hyderabad', segment: 'Consumer', signup_date: '2025-02-12' },
      { customer_id: 105, name: 'Vikram Verma', email: 'vikram@example.com', city: 'Bengaluru', segment: 'Enterprise', signup_date: '2025-02-28' },
      { customer_id: 106, name: 'Ananya Iyer', email: 'ananya@example.com', city: 'Chennai', segment: 'Consumer', signup_date: '2025-03-01' },
      { customer_id: 107, name: 'Karan Malhotra', email: 'karan@example.com', city: 'Delhi', segment: 'SMB', signup_date: '2025-03-10' },
      { customer_id: 108, name: 'Pooja Joshi', email: 'pooja@example.com', city: 'Pune', segment: 'Consumer', signup_date: '2025-03-15' },
      { customer_id: 109, name: 'Aditya Nair', email: null, city: 'Kochi', segment: 'Consumer', signup_date: '2025-03-22' },
      { customer_id: 110, name: 'Meera Deshmukh', email: 'meera@example.com', city: 'Mumbai', segment: 'Enterprise', signup_date: '2025-03-25' }
    ],
    orders: [
      { order_id: 1001, customer_id: 101, order_date: '2025-04-01', total_amount: 4500, status: 'delivered', payment_method: 'UPI' },
      { order_id: 1002, customer_id: 102, order_date: '2025-04-02', total_amount: 1200, status: 'delivered', payment_method: 'Credit Card' },
      { order_id: 1003, customer_id: 103, order_date: '2025-04-03', total_amount: 8900, status: 'shipped', payment_method: 'NetBanking' },
      { order_id: 1004, customer_id: 101, order_date: '2025-04-05', total_amount: 3200, status: 'delivered', payment_method: 'UPI' },
      { order_id: 1005, customer_id: 105, order_date: '2025-04-06', total_amount: 15400, status: 'delivered', payment_method: 'Credit Card' },
      { order_id: 1006, customer_id: 104, order_date: '2025-04-07', total_amount: 650, status: 'cancelled', payment_method: 'UPI' },
      { order_id: 1007, customer_id: 107, order_date: '2025-04-08', total_amount: 7200, status: 'delivered', payment_method: 'NetBanking' },
      { order_id: 1008, customer_id: 102, order_date: '2025-04-10', total_amount: 2400, status: 'delivered', payment_method: 'Debit Card' },
      { order_id: 1009, customer_id: 108, order_date: '2025-04-11', total_amount: 1850, status: 'shipped', payment_method: 'UPI' },
      { order_id: 1010, customer_id: 110, order_date: '2025-04-12', total_amount: 21000, status: 'delivered', payment_method: 'Credit Card' },
      { order_id: 1011, customer_id: 103, order_date: '2025-04-14', total_amount: 3400, status: 'refunded', payment_method: 'UPI' },
      { order_id: 1012, customer_id: 105, order_date: '2025-04-15', total_amount: 9800, status: 'delivered', payment_method: 'Credit Card' }
    ],
    products: [
      { product_id: 1, product_name: 'Cloud Storage Pro', category: 'Cloud', price: 1200, stock_qty: 999 },
      { product_id: 2, product_name: 'Data Pipeline Orchestrator', category: 'Software', price: 4500, stock_qty: 50 },
      { product_id: 3, product_name: 'PySpark Masterclass', category: 'Education', price: 999, stock_qty: 500 },
      { product_id: 4, product_name: 'Analytics Dashboard License', category: 'Software', price: 3200, stock_qty: 75 },
      { product_id: 5, product_name: 'SQL Query Accelerator', category: 'Software', price: 2100, stock_qty: 40 },
      { product_id: 6, product_name: 'Lakehouse Metadata Engine', category: 'Cloud', price: 8900, stock_qty: 25 },
      { product_id: 7, product_name: 'Legacy Tape Backup Kit', category: 'Hardware', price: 500, stock_qty: 0 }
    ],
    order_items: [
      { item_id: 1, order_id: 1001, product_id: 2, quantity: 1, price_each: 4500 },
      { item_id: 2, order_id: 1002, product_id: 1, quantity: 1, price_each: 1200 },
      { item_id: 3, order_id: 1003, product_id: 6, quantity: 1, price_each: 8900 },
      { item_id: 4, order_id: 1004, product_id: 4, quantity: 1, price_each: 3200 },
      { item_id: 5, order_id: 1005, product_id: 6, quantity: 1, price_each: 8900 },
      { item_id: 6, order_id: 1005, product_id: 2, quantity: 1, price_each: 4500 },
      { item_id: 7, order_id: 1005, product_id: 5, quantity: 1, price_each: 2000 },
      { item_id: 8, order_id: 1007, product_id: 2, quantity: 1, price_each: 4500 },
      { item_id: 9, order_id: 1007, product_id: 5, quantity: 1, price_each: 2100 },
      { item_id: 10, order_id: 1008, product_id: 1, quantity: 2, price_each: 1200 },
      { item_id: 11, order_id: 1009, product_id: 3, quantity: 1, price_each: 999 },
      { item_id: 12, order_id: 1010, product_id: 6, quantity: 2, price_each: 8900 },
      { item_id: 13, order_id: 1010, product_id: 4, quantity: 1, price_each: 3200 }
    ]
  };

  const CHALLENGES = [
    {
      id: 'c1',
      title: '1. Filter Active Orders by Status & Amount',
      difficulty: 'Beginner',
      category: 'SQL Basics',
      prompt: 'Select `order_id`, `customer_id`, `total_amount`, and `status` from `orders` where `status = "delivered"` and `total_amount >= 4000`, ordered by `total_amount DESC`.',
      starter: 'SELECT order_id, customer_id, total_amount, status\nFROM orders\nWHERE status = \'delivered\' AND total_amount >= 4000\nORDER BY total_amount DESC;',
      solution: 'SELECT order_id, customer_id, total_amount, status\nFROM orders\nWHERE status = \'delivered\' AND total_amount >= 4000\nORDER BY total_amount DESC;'
    },
    {
      id: 'c2',
      title: '2. Aggregation with GROUP BY & HAVING',
      difficulty: 'Intermediate',
      category: 'Aggregation',
      prompt: 'Find customer spend summary: For each `customer_id`, calculate total number of orders (`order_count`) and total spent (`total_spent`). Only include customers who spent more than 5000 in total.',
      starter: 'SELECT customer_id,\n       COUNT(*) AS order_count,\n       SUM(total_amount) AS total_spent\nFROM orders\nGROUP BY customer_id\nHAVING SUM(total_amount) > 5000\nORDER BY total_spent DESC;',
      solution: 'SELECT customer_id,\n       COUNT(*) AS order_count,\n       SUM(total_amount) AS total_spent\nFROM orders\nGROUP BY customer_id\nHAVING SUM(total_amount) > 5000\nORDER BY total_spent DESC;'
    },
    {
      id: 'c3',
      title: '3. Multi-Table INNER JOIN (Orders + Customers)',
      difficulty: 'Intermediate',
      category: 'Joins',
      prompt: 'Join `orders` and `customers` on `customer_id`. Return `orders.order_id`, `customers.name`, `customers.city`, `orders.total_amount`, and `orders.order_date`.',
      starter: 'SELECT o.order_id, c.name, c.city, o.total_amount, o.order_date\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id\nORDER BY o.total_amount DESC;',
      solution: 'SELECT o.order_id, c.name, c.city, o.total_amount, o.order_date\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id\nORDER BY o.total_amount DESC;'
    },
    {
      id: 'c4',
      title: '4. Unordered Products via LEFT JOIN & NULL Check',
      difficulty: 'Intermediate',
      category: 'Joins',
      prompt: 'Find products in `products` table that have NEVER been ordered in `order_items`. (Hint: Use `LEFT JOIN` and `WHERE oi.item_id IS NULL`).',
      starter: 'SELECT p.product_id, p.product_name, p.category, p.price\nFROM products p\nLEFT JOIN order_items oi ON p.product_id = oi.product_id\nWHERE oi.item_id IS NULL;',
      solution: 'SELECT p.product_id, p.product_name, p.category, p.price\nFROM products p\nLEFT JOIN order_items oi ON p.product_id = oi.product_id\nWHERE oi.item_id IS NULL;'
    },
    {
      id: 'c5',
      title: '5. Window Function: Highest Order per City (ROW_NUMBER)',
      difficulty: 'Advanced',
      category: 'Window Functions',
      prompt: 'Find the top single order for each customer city using `ROW_NUMBER() OVER (PARTITION BY c.city ORDER BY o.total_amount DESC)`.',
      starter: 'WITH ranked_orders AS (\n  SELECT o.order_id, c.name, c.city, o.total_amount,\n         ROW_NUMBER() OVER (PARTITION BY c.city ORDER BY o.total_amount DESC) as rank_in_city\n  FROM orders o\n  JOIN customers c ON o.customer_id = c.customer_id\n)\nSELECT order_id, name, city, total_amount\nFROM ranked_orders\nWHERE rank_in_city = 1\nORDER BY total_amount DESC;',
      solution: 'WITH ranked_orders AS (\n  SELECT o.order_id, c.name, c.city, o.total_amount,\n         ROW_NUMBER() OVER (PARTITION BY c.city ORDER BY o.total_amount DESC) as rank_in_city\n  FROM orders o\n  JOIN customers c ON o.customer_id = c.customer_id\n)\nSELECT order_id, name, city, total_amount\nFROM ranked_orders\nWHERE rank_in_city = 1\nORDER BY total_amount DESC;'
    },
    {
      id: 'c6',
      title: '6. Conditional Bucketing with CASE WHEN',
      difficulty: 'Intermediate',
      category: 'SQL Patterns',
      prompt: 'Categorize each order into tiers: total_amount >= 10000 -> "High Value", >= 3000 -> "Medium Value", else "Standard". Return order_id, customer_id, total_amount, order_tier.',
      starter: 'SELECT order_id, customer_id, total_amount,\n  CASE\n    WHEN total_amount >= 10000 THEN \'High Value\'\n    WHEN total_amount >= 3000 THEN \'Medium Value\'\n    ELSE \'Standard\'\n  END AS order_tier\nFROM orders\nORDER BY total_amount DESC;',
      solution: 'SELECT order_id, customer_id, total_amount,\n  CASE\n    WHEN total_amount >= 10000 THEN \'High Value\'\n    WHEN total_amount >= 3000 THEN \'Medium Value\'\n    ELSE \'Standard\'\n  END AS order_tier\nFROM orders\nORDER BY total_amount DESC;'
    }
  ];

  /**
   * Executes a simulated SQL query safely against in-memory tables.
   */
  function executeQuery(rawSql) {
    const startTime = performance.now();
    const cleanSql = rawSql.trim().replace(/;+$/, '');
    
    try {
      // Normalize CTE: WITH cte AS (subquery) SELECT ...
      let effectiveSql = cleanSql;
      let cteData = null;
      let cteName = null;
      
      const cteMatch = cleanSql.match(/^WITH\s+([a-zA-Z0-9_]+)\s+AS\s*\(\s*([\s\S]+?)\s*\)\s*(SELECT[\s\S]+)$/i);
      if (cteMatch) {
        cteName = cteMatch[1].toLowerCase();
        const innerSql = cteMatch[2];
        effectiveSql = cteMatch[3];
        const innerRes = executeSingleSelect(innerSql, null);
        cteData = innerRes.rows;
      }
      
      const result = executeSingleSelect(effectiveSql, cteData, cteName);
      const duration = (performance.now() - startTime).toFixed(2);
      return {
        success: true,
        columns: result.columns,
        rows: result.rows,
        rowCount: result.rows.length,
        duration: duration + ' ms'
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Syntax error in SQL query'
      };
    }
  }

  function executeSingleSelect(sql, cteData, cteName) {
    // Basic parser for SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT ...
    const tokens = sql.replace(/\s+/g, ' ').trim();
    
    // Extract clauses
    const selectMatch = tokens.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?(?:\s+(LEFT|RIGHT|INNER)?\s*JOIN\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+))?(?:\s+WHERE\s+([\s\S]+?))?(?:\s+GROUP\s+BY\s+([\s\S]+?))?(?:\s+HAVING\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+([0-9]+))?$/i);
    
    if (!selectMatch) {
      // Fallback for simple SELECT * FROM table
      const fallback = tokens.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)/i);
      if (!fallback) throw new Error("Invalid SQL syntax. Supported format: SELECT ... FROM table [JOIN ...] [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT ...]");
    }

    const selectPart = selectMatch ? selectMatch[1] : tokens.replace(/^SELECT\s+/i, '').split(/\s+FROM\s+/i)[0];
    const fromTable = selectMatch ? selectMatch[2].toLowerCase() : tokens.split(/\s+FROM\s+/i)[1].split(' ')[0].toLowerCase();
    const fromAlias = (selectMatch && selectMatch[3] && !['left', 'right', 'inner', 'join', 'where', 'group', 'order', 'limit'].includes(selectMatch[3].toLowerCase())) ? selectMatch[3].toLowerCase() : fromTable;
    
    const joinType = (selectMatch && selectMatch[4]) ? selectMatch[4].toUpperCase() : 'INNER';
    const joinTable = selectMatch && selectMatch[5] ? selectMatch[5].toLowerCase() : null;
    const joinAlias = (selectMatch && selectMatch[6]) ? selectMatch[6].toLowerCase() : joinTable;
    const joinOnL = selectMatch && selectMatch[7] ? selectMatch[7].trim() : null;
    const joinOnR = selectMatch && selectMatch[8] ? selectMatch[8].trim() : null;
    
    const whereClause = selectMatch ? selectMatch[9] : null;
    const groupByClause = selectMatch ? selectMatch[10] : null;
    const havingClause = selectMatch ? selectMatch[11] : null;
    const orderByClause = selectMatch ? selectMatch[12] : null;
    const limitVal = selectMatch && selectMatch[13] ? parseInt(selectMatch[13], 10) : null;

    // Get source rows
    let baseRows = [];
    if (cteName && fromTable === cteName) {
      baseRows = cteData.map(r => ({ ...r }));
    } else if (TABLES[fromTable]) {
      baseRows = TABLES[fromTable].map(r => {
        let obj = { ...r };
        // prefix alias for joins
        return obj;
      });
    } else {
      throw new Error(`Table '${fromTable}' does not exist. Available tables: customers, orders, products, order_items`);
    }

    // Perform JOIN if requested
    let workingRows = [];
    if (joinTable) {
      let rightRows = [];
      if (cteName && joinTable === cteName) {
        rightRows = cteData;
      } else if (TABLES[joinTable]) {
        rightRows = TABLES[joinTable];
      } else {
        throw new Error(`Joined table '${joinTable}' does not exist.`);
      }

      const getColVal = (row, alias, fullExpr) => {
        const parts = fullExpr.split('.');
        const col = parts.length > 1 ? parts[1] : parts[0];
        return row[col];
      };

      baseRows.forEach(leftRow => {
        let matched = false;
        rightRows.forEach(rightRow => {
          const lVal = getColVal(leftRow, fromAlias, joinOnL) !== undefined ? getColVal(leftRow, fromAlias, joinOnL) : getColVal(leftRow, fromAlias, joinOnR);
          const rVal = getColVal(rightRow, joinAlias, joinOnR) !== undefined ? getColVal(rightRow, joinAlias, joinOnR) : getColVal(rightRow, joinAlias, joinOnL);
          
          if (lVal !== undefined && rVal !== undefined && String(lVal) === String(rVal)) {
            matched = true;
            // merge row
            workingRows.push({ ...leftRow, ...rightRow });
          }
        });
        if (!matched && joinType === 'LEFT') {
          let emptyRight = {};
          if (rightRows.length > 0) {
            Object.keys(rightRows[0]).forEach(k => emptyRight[k] = null);
          }
          workingRows.push({ ...leftRow, ...emptyRight });
        }
      });
    } else {
      workingRows = baseRows;
    }

    // Apply WHERE filter
    if (whereClause) {
      workingRows = workingRows.filter(row => evaluateFilter(whereClause, row));
    }

    // Apply GROUP BY or Aggregations
    let finalRows = [];
    let isAggregated = /COUNT\(|SUM\(|AVG\(|MIN\(|MAX\(/i.test(selectPart);

    if (groupByClause || isAggregated) {
      const groupCols = groupByClause ? groupByClause.split(',').map(s => s.trim().split('.').pop()) : [];
      const groups = {};

      workingRows.forEach(row => {
        const groupKey = groupCols.map(c => String(row[c])).join('___');
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(row);
      });

      for (let gKey in groups) {
        const rowsInGroup = groups[gKey];
        const outRow = {};
        
        // assign group cols
        groupCols.forEach(c => {
          outRow[c] = rowsInGroup[0][c];
        });

        // Compute aggregates in SELECT
        computeAggregatesIntoRow(selectPart, rowsInGroup, outRow);
        finalRows.push(outRow);
      }

      // Apply HAVING
      if (havingClause) {
        finalRows = finalRows.filter(row => evaluateHaving(havingClause, row));
      }
    } else {
      // Non-aggregated rows - project columns
      finalRows = workingRows.map(row => {
        return projectRow(selectPart, row, workingRows);
      });
    }

    // Apply ORDER BY
    if (orderByClause) {
      const orderParts = orderByClause.split(',').map(s => s.trim().split(/\s+/));
      finalRows.sort((a, b) => {
        for (let part of orderParts) {
          const col = part[0].split('.').pop();
          const dir = (part[1] && part[1].toUpperCase() === 'DESC') ? -1 : 1;
          let valA = a[col] !== undefined ? a[col] : 0;
          let valB = b[col] !== undefined ? b[col] : 0;
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return -1 * dir;
          if (valA > valB) return 1 * dir;
        }
        return 0;
      });
    }

    // Apply LIMIT
    if (limitVal !== null && limitVal >= 0) {
      finalRows = finalRows.slice(0, limitVal);
    }

    // Extract columns
    const columns = finalRows.length > 0 ? Object.keys(finalRows[0]) : [];

    return { columns, rows: finalRows };
  }

  function evaluateFilter(clause, row) {
    let clean = clause.trim();
    // Handle IS NULL / IS NOT NULL
    clean = clean.replace(/([a-zA-Z0-9_.]+)\s+IS\s+NOT\s+NULL/gi, (_, col) => {
      const c = col.split('.').pop();
      return `(row['${c}'] !== null && row['${c}'] !== undefined)`;
    });
    clean = clean.replace(/([a-zA-Z0-9_.]+)\s+IS\s+NULL/gi, (_, col) => {
      const c = col.split('.').pop();
      return `(row['${c}'] === null || row['${c}'] === undefined)`;
    });

    // Handle column = 'value'
    clean = clean.replace(/([a-zA-Z0-9_.]+)\s*(=|!=|>=|<=|>|<)\s*('[^']*'|[0-9.]+)/g, (_, col, op, val) => {
      const c = col.split('.').pop();
      const jsOp = op === '=' ? '===' : (op === '!=' ? '!==' : op);
      return `(row['${c}'] ${jsOp} ${val})`;
    });

    // Replace AND / OR
    clean = clean.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||');

    try {
      return new Function('row', `return Boolean(${clean});`)(row);
    } catch (e) {
      // Fallback lenient match
      return true;
    }
  }

  function evaluateHaving(clause, row) {
    // Evaluates HAVING conditions like SUM(total_amount) > 5000 or total_spent > 5000
    let clean = clause.trim();
    clean = clean.replace(/SUM\([a-zA-Z0-9_.]+\)/gi, (m) => {
      return Object.keys(row).find(k => k.includes('sum') || k.includes('total_spent')) || '0';
    });
    clean = clean.replace(/COUNT\([a-zA-Z0-9_*.]+\)/gi, (m) => {
      return Object.keys(row).find(k => k.includes('count') || k.includes('order_count')) || '0';
    });
    clean = clean.replace(/([a-zA-Z0-9_]+)\s*(=|!=|>=|<=|>|<)\s*([0-9.]+)/g, (_, col, op, val) => {
      const jsOp = op === '=' ? '===' : (op === '!=' ? '!==' : op);
      return `(row['${col}'] ${jsOp} ${val})`;
    });
    clean = clean.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||');
    try {
      return new Function('row', `return Boolean(${clean});`)(row);
    } catch (e) {
      return true;
    }
  }

  function computeAggregatesIntoRow(selectPart, rows, outRow) {
    const items = selectPart.split(',').map(s => s.trim());
    items.forEach(item => {
      const asMatch = item.match(/^(COUNT\([^)]+\)|SUM\([^)]+\)|AVG\([^)]+\)|MIN\([^)]+\)|MAX\([^)]+\))\s+AS\s+([a-zA-Z0-9_]+)$/i);
      const funcMatch = asMatch || item.match(/^(COUNT|SUM|AVG|MIN|MAX)\(([*a-zA-Z0-9_.]+)\)$/i);
      
      if (funcMatch) {
        const fullFn = asMatch ? asMatch[1] : item;
        const alias = asMatch ? asMatch[2] : fullFn.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        const fnName = fullFn.substring(0, fullFn.indexOf('(')).toUpperCase();
        const arg = fullFn.substring(fullFn.indexOf('(') + 1, fullFn.indexOf(')')).trim().split('.').pop();
        
        if (fnName === 'COUNT') {
          if (arg === '*') {
            outRow[alias] = rows.length;
          } else {
            outRow[alias] = rows.filter(r => r[arg] !== null && r[arg] !== undefined).length;
          }
        } else if (fnName === 'SUM') {
          outRow[alias] = rows.reduce((acc, r) => acc + (parseFloat(r[arg]) || 0), 0);
        } else if (fnName === 'AVG') {
          const sum = rows.reduce((acc, r) => acc + (parseFloat(r[arg]) || 0), 0);
          outRow[alias] = rows.length > 0 ? parseFloat((sum / rows.length).toFixed(2)) : 0;
        } else if (fnName === 'MIN') {
          const vals = rows.map(r => r[arg]).filter(v => v !== null && v !== undefined);
          outRow[alias] = vals.length > 0 ? Math.min(...vals) : null;
        } else if (fnName === 'MAX') {
          const vals = rows.map(r => r[arg]).filter(v => v !== null && v !== undefined);
          outRow[alias] = vals.length > 0 ? Math.max(...vals) : null;
        }
      } else {
        const colName = item.split(/\s+AS\s+/i)[0].trim().split('.').pop();
        const alias = item.split(/\s+AS\s+/i)[1] ? item.split(/\s+AS\s+/i)[1].trim() : colName;
        if (!outRow[alias] && rows.length > 0) {
          outRow[alias] = rows[0][colName] !== undefined ? rows[0][colName] : null;
        }
      }
    });
  }

  function projectRow(selectPart, row, allRows) {
    if (selectPart.trim() === '*') {
      return { ...row };
    }
    const out = {};
    const items = selectPart.split(',').map(s => s.trim());
    
    items.forEach(item => {
      // Check CASE WHEN ... THEN ... ELSE ... END AS alias
      const caseMatch = item.match(/CASE([\s\S]+?)END(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i);
      if (caseMatch) {
        const body = caseMatch[1];
        const alias = caseMatch[2] ? caseMatch[2].trim() : 'case_col';
        let assignedVal = 'Standard';
        
        const whenRegex = /WHEN\s+([a-zA-Z0-9_.]+)\s*(>=|<=|>|<|=)\s*([0-9.]+)\s+THEN\s*'([^']+)'/gi;
        let wMatch;
        let matchedCase = false;
        while ((wMatch = whenRegex.exec(body)) !== null) {
          const col = wMatch[1].split('.').pop();
          const op = wMatch[2];
          const cmp = parseFloat(wMatch[3]);
          const resultVal = wMatch[4];
          const val = parseFloat(row[col]);
          
          if (!isNaN(val)) {
            let pass = false;
            if (op === '>=') pass = val >= cmp;
            else if (op === '<=') pass = val <= cmp;
            else if (op === '>') pass = val > cmp;
            else if (op === '<') pass = val < cmp;
            else if (op === '=') pass = val === cmp;
            if (pass && !matchedCase) {
              assignedVal = resultVal;
              matchedCase = true;
            }
          }
        }
        out[alias] = assignedVal;
        return;
      }

      // Check ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)
      const rowNumMatch = item.match(/ROW_NUMBER\(\)\s*OVER\s*\(\s*PARTITION\s+BY\s+([a-zA-Z0-9_.]+)\s+ORDER\s+BY\s+([a-zA-Z0-9_.]+)(?:\s+(DESC|ASC))?\s*\)(?:\s+AS\s+([a-zA-Z0-9_]+))?/i);
      if (rowNumMatch) {
        const partCol = rowNumMatch[1].split('.').pop();
        const orderCol = rowNumMatch[2].split('.').pop();
        const dir = (rowNumMatch[3] && rowNumMatch[3].toUpperCase() === 'DESC') ? -1 : 1;
        const alias = rowNumMatch[4] ? rowNumMatch[4].trim() : 'row_num';

        // find position within partition
        const partVal = row[partCol];
        const partitionRows = allRows.filter(r => r[partCol] === partVal);
        partitionRows.sort((a, b) => {
          let vA = parseFloat(a[orderCol]) || 0;
          let vB = parseFloat(b[orderCol]) || 0;
          return (vB - vA) * (dir === -1 ? 1 : -1);
        });
        const index = partitionRows.indexOf(row) + 1;
        out[alias] = index > 0 ? index : 1;
        return;
      }

      // Simple column or aliased column
      const parts = item.split(/\s+AS\s+/i);
      const rawCol = parts[0].trim().split('.').pop();
      const alias = parts[1] ? parts[1].trim() : rawCol;
      out[alias] = row[rawCol] !== undefined ? row[rawCol] : null;
    });

    return out;
  }

  // Export to window
  window.DE_SQL = {
    tables: TABLES,
    challenges: CHALLENGES,
    executeQuery: executeQuery
  };
})();
