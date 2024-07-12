const BankDatabase = require('./BankDatabase');
const config = require('./Config');
const RuleToSqlParser = require('./RuleToSqlParser');
const TransactionQuery = require('./TransactionQuery.cjs');


class RulesClassifier {

    constructor() {
        this.db = new BankDatabase();
        this.ruleComponents = {}
    }

    _applyRule(rule_id, ruleWhereClause, params, txids, newTags, party) {
        // Building the dynamic part of the WHERE clause based on the txids provided
        let txidsCondition = '';
        // let params = [];

        if (!Array.isArray(newTags)) {
            throw new TypeError('The rule.tags is not an array.');
        }
        if (!Array.isArray(party)) {
            throw new TypeError('The rule.party is not an array.');
        }

        if (txids && txids.length > 0) {
            txidsCondition = `AND id IN (${txids.map(() => '?').join(', ')})`;
            params = params.concat(txids);
        }

        
        
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
            // auto_tags.tags
            // auto_tags.ruleid
            const tags = JSON.parse(transaction.auto_tags || '{}')
            const existingTags = tags?.tags || [];
            const existingRuleIds = tags?.rule || [];

            // Use Set to remove duplicates
            const mergedTags = Array.from(new Set([...existingTags, ...newTags]));
            const mergedRuleIds = Array.from(new Set([...existingRuleIds, rule_id]));

            // Add the new tags object
            let tagJson = "{}"
            if (mergedTags && mergedTags.length > 0) {
                const tagObj = { "tags": mergedTags, "rule": mergedRuleIds }
                tagJson = JSON.stringify(tagObj);
            }

            let partyJson = "{}"
            if (party && party.length > 0) {
                // console.log("party>>", party)
                partyJson = JSON.stringify({ party: party, rule: rule_id })
            }

            updateStmt.run(tagJson, partyJson, transaction.id);

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
            SET tags = '{}',
                party = '{}'
            ${txidsCondition}`

        // console.log(`resetTagsQuery: ${resetTagsQuery}`)
        const stmt = this.db.db.prepare(resetTagsQuery)
        // stmt.run(params);
        try {
            this.db.db.transaction(() => {
                stmt.run(params);
            })();
        } catch (error) {
            console.error("Error updating transactions:", error);
        }

    }

    applyOneRule(id) {
        const rule = this.db.db.prepare('SELECT * FROM "rule" WHERE id = ?').get(id);
        this.applyOneRuleDirectly(rule)
    }

    applyOneRuleDirectly(rule) {
        // const cnt = new RulesClassifier().applyOneRuleDirectly(rule)

        // Classify this rule across all transactions
        const parser = new RuleToSqlParser();
        let cnt = 0
        // const classifier = new RulesClassifier()
        try {

            const whereSqlObj = parser.parse(rule.rule);
            cnt = this._applyRule(
                rule.id,
                whereSqlObj.sql,
                whereSqlObj.params,
                null,
                JSON.parse(rule.tag),
                JSON.parse(rule.party)
            )
        } catch (e) {
            console.log("Rule processing failed:", rule)
        }

        return cnt
    }

    getTransactionsMatchingRuleId(ruleid) {
        let query = `SELECT distinct(id)
                        FROM "transaction"
                        WHERE 
                        EXISTS (
                            SELECT 1
                            FROM json_each(json_extract(tags, '$.rule'))
                            WHERE json_each.value = ?
                        )
                        OR
                        EXISTS (
                            SELECT 1
                            FROM json_each(json_extract(party, '$.party'))
                            WHERE json_each.value = ?
                        );`

        const transactions = this.db.db.prepare(query).all(ruleid, ruleid);
        const transaction_ids = transactions.map(transaction => transaction.id);
        return transaction_ids
    }
  
    applyAllRules(txids) {
        let query = 'SELECT * FROM "rule"';
        const result = this.db.db.prepare(query).all();
        let parser = new RuleToSqlParser(); // Initialize a new instance of the parser for each test

        this.clearTags(txids)

        let cnt = 0
        for (const rule of result) {

            try {
                const whereSqlObj = parser.parse(rule.rule);

                const tag = JSON.parse(rule?.tag || [])
                const party = JSON.parse(rule?.party || [])

                cnt += this._applyRule(
                    rule.id,
                    whereSqlObj.sql,
                    whereSqlObj.params,
                    txids,
                    tag,
                    party
                )
            }
            catch (e) {
                console.log(`Rule processing failed: ${e}\n   ${JSON.stringify(rule)}\n`)
            }

        }
        return cnt
    }

}

module.exports = RulesClassifier;
