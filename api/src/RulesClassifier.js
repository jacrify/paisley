const BankDatabase = require('./BankDatabase');
const config = require('./Config');
const RuleToSqlParser = require('./RuleToSqlParser');
const TransactionQuery = require('./TransactionQuery.cjs');


class RulesClassifier {

    constructor() {
        this.db = new BankDatabase();
        this.ruleComponents = {}
    }

    applyRule(ruleWhereClause, params, txids, newTags, party) {
        // Building the dynamic part of the WHERE clause based on the txids provided
        let txidsCondition = '';
        // let params = [];

        if (txids && txids.length > 0) {
            txidsCondition = `AND id IN (${txids.map(() => '?').join(', ')})`;
            params = params.concat(txids);
        }

        // TODO: this needs to return
        //          orig_description
        //          new_description
        //          description CASE
        //          rules can use any of them.
        // Fetch the current tags for transactions that match the rule and txids

        const fetchSql = TransactionQuery.allTransactionsQuery +
            ` AND ${ruleWhereClause} ${txidsCondition}`
        // console.log(`fetchSql: ${fetchSql}`)
        const fetchStmt = this.db.db.prepare(fetchSql);
        const transactions = fetchStmt.all(params);

        // Prepare the SQL statement for updating tags and party
        const updateSql = `
            UPDATE 'transaction'
            SET tags = ?,
                party = COALESCE(?, party)
            WHERE id = ?
        `;
        const updateStmt = this.db.db.prepare(updateSql);

        // Update each transaction with the new merged tags
        transactions.forEach(transaction => {
            const existingTags = JSON.parse(transaction.auto_tags || '[]');
            const mergedTags = Array.from(new Set([...existingTags, ...newTags])); // Use Set to remove duplicates
            const tagsJson = JSON.stringify(mergedTags);
            updateStmt.run(tagsJson, JSON.stringify(party), transaction.id);
        });

        // console.log(`Rows updated: ${transactions.length}`);
        return transactions.length
    }

    // will clear ALL tags, 
    // or if supplied with txids, will clear just those
    clearTags(txids) {
        // RESET tags and party for txids
        let txidsCondition = ""
        let params = []

        if (txids && txids.length > 0) {
            txidsCondition = ` WHERE id IN (${txids.map(() => '?').join(', ')})`;
            params = txids
        }

        let resetTagsQuery = `UPDATE "transaction"
            SET tags = '[]',
                party = '[]'
            ${txidsCondition}`

        // console.log(`resetTagsQuery: ${resetTagsQuery}`)
        const stmt = this.db.db.prepare(resetTagsQuery)
        stmt.run(params);
    }


    applyOneRule(id) {
        const rule = this.db.db.prepare('SELECT * FROM "rule" WHERE id = ?').get(id);

        // Classify this rule across all transactions
        const parser = new RuleToSqlParser();
        const classifier = new RulesClassifier()
        const whereSqlObj = parser.parse(rule.rule);
        const cnt = classifier.applyRule(
            whereSqlObj.sql,
            whereSqlObj.params,
            null,
            JSON.parse(rule.tag),
            JSON.parse(rule.party)
        )
        return cnt
    }

    applyAllRules(txids) {
        let query = 'SELECT * FROM "rule"';
        const result = this.db.db.prepare(query).all();
        let parser = new RuleToSqlParser(); // Initialize a new instance of the parser for each test

        this.clearTags(txids)

        let cnt = 0
        for (const rule of result) {
            const whereSqlObj = parser.parse(rule.rule);
            const tag = JSON.parse(rule.tag || [])
            const party = JSON.parse(rule.party || [])

            cnt += this.applyRule(
                whereSqlObj.sql,
                whereSqlObj.params,
                txids,
                tag,
                party
            )
        }
        return cnt
    }

}

module.exports = RulesClassifier;
