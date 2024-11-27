---
title: "Test smarter: Where should tests go in your pipeline?"
description: "Testing your data should drive action, not accumulate alerts. We take our testing framework developed in our last post and make recommendations for where tests ought to go at each transformation stage."
slug: test-smarter-where-tests-should-go

authors: [faith_mckenna, jerrie_kumalah_kenney]

tags: [analytics craft]
hide_table_of_contents: false

date: 2024-12-09
is_featured: true
---

👋 Greetings, dbt’ers! It’s Faith & Jerrie, back again to offer tactical advice on *where* to put tests in your pipeline.

In [our first post](https://docs.getdbt.com/blog/test-smarter-not-harder) on refining testing best practices, we developed a prioritized list of data quality concerns. We also documented first steps for debugging each concern. This post will guide you on where specific tests should go in your data pipeline.

*Note that we are constructing this guidance based on how we [structure data at dbt Labs.](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview#guide-structure-overview)* You may use a different modeling approach—that’s okay! Translate our guidance to your data’s shape, and let us know in the comments section what modifications you made. 

First, here’s our opinions on where specific tests should go:

- Source tests should be fixable data quality concerns. (See the callout box below for what we mean by “fixable”)
- Staging tests should be business-focused anomalies specific to individual tables, such as accepted ranges or ensuring sequential values. In addition to these tests, your staging layer should clean **up **any nulls, duplicates, or outliers that you can’t fix in your source system. You generally don’t need to test your cleanup efforts.
- Intermediate and marts layer tests should be business-focused anomalies resulting specifically from joins or calculations.  You also may consider adding additional primary key and not null tests on columns where it’s especially important to protect the grain.

## Where should tests go in your pipeline?

![A horizontal, multicolored diagram that shows examples of where tests ought to be placed in a data pipeline.](/img/blog/2024-11-27-test-smarter-part-2/testing_pipeline.png)

This diagram above outlines where you might put specific data tests in your pipeline. Let’s expand on it and discuss where each type of data quality issue should be tested. 

### Sources

Tests applied to your sources should indicate **fixable-at-the-source-system** issues**.** If your source tests flag source system issues that aren’t fixable, remove the test and mitigate the problem in your staging layer instead. 

:::info
💡 A note on what we mean by *fixable*: We consider a "fixable-at-the-source-system" issue to be something that:

- You yourself can fix in the source system.
- You know the right person to fix it and have a good enough relationship with them that you know you can *get it fixed.*

You may have issues that can *technically* get fixed at the source, but it won't happen till the next planning cycle, or you need to develop better relationships to get the issue fixed, or something similar. This demands a more nuanced approach than we'll cover in this post. If you have thoughts on this type of situation, let us know!

:::

Here’s our recommendation for what tests belong on your sources. 

- Source freshness: testing data freshness for sources that are critical to your pipelines.
    - If any sources feed into any of the “top 3” [priority categories](https://docs.getdbt.com/blog/test-smarter-not-harder#how-to-prioritize-data-quality-concerns-in-your-pipeline) in our last post, put [`dbt source freshness`](https://docs.getdbt.com/docs/deploy/source-freshness) in your job execution commands. If your sources are stale, dbt Cloud will fail your job.
    - If none of your sources feed into high priority categories, check the box in the dbt Cloud UI so source freshness doesn’t fail your job.
- Data hygiene: tests that are *fixable* in the source system (see our note above on “fixability”).
    - Examples:
        - Duplicate customer records that can be deleted in the source system
        - Null records, such as a customer name or email address, that can be entered into the source system
        - Primary key testing where duplicates are removable in the source system

### Staging

In the staging layer, focus on business anomaly detection as well as cleaning up or mitigating data issues that can't be fixed at the source.  

- Data cleanup and issue mitigation: You will probably have data quality or hygiene issues that you can’t fix in your source system. This is what your staging layer is for. Use our [best practices around staging layers](https://docs.getdbt.com/best-practices/how-we-structure/2-staging) to clean things up. Don’t add tests to your cleanup efforts. If you’re filtering out nulls in a column, adding a not_null test is repetitive!  🌶️
- Business-focused anomaly examples: these are data quality issues you *should* test for in your staging layer, because they fall outside of your business’s defined norms. These might be:
    - Values inside a single column that fall outside of an acceptable range. For example, a sale amount that may indicate excessive discounting and require intervention.
    - A transaction size that usually indicates fraud and spurs further investigation into the offending transaction.
    - An monthly invoice amount that varies more than a certain % from other invoices in its category. This could indicate anything from a clerical error to improper spending, and is worth flagging with a test.

### Intermediate (if applicable)

In your intermediate layer, focus on data hygiene and anomaly tests for new columns. Don’t re-test passthrough columns from sources or staging. Here are some examples of tests you might put in your intermediate layer based on the use cases of intermediate models we [outline in this guide.](https://docs.getdbt.com/best-practices/how-we-structure/3-intermediate#intermediate-models)

- Intermediate models often re-grain models to prepare them for marts.
    - Add a primary key test to any re-grained models.
    - Additionally, consider adding a primary key test to models where the grain *has remained the same* but has been *enriched.* This helps future-proof your enriched models against future developers who may not be able to glean your intention from SQL alone.
- Intermediate models may perform a first set of joins or aggregations to reduce complexity in a final mart.
    - Add simple anomaly tests to verify the behavior of your sets of joins and aggregations. This may look like:
        - An [accepted_values](https://docs.getdbt.com/reference/resource-properties/data-tests#accepted_values) test on a newly calculated categorical column.
        - A [mutually_exclusive_ranges](https://docs.getdbt.com/reference/resource-properties/data-tests#accepted_values) test on two columns whose values behave in relation to one another (ex: asserting age ranges do not overlap).
        - A [not_constant](https://docs.getdbt.com/reference/resource-properties/data-tests#accepted_values) test on a column whose value should be continually changing (ex: page view counts on website analytics).
- Intermediate models may isolate complex operations.
    - The anomaly tests we list above may suffice here.
    - You might also consider [unit testing](https://docs.getdbt.com/docs/build/unit-tests) any particularly complex pieces of SQL logic.

### Marts

Marts layer testing will follow the same hygiene-or-anomaly pattern as staging and intermediate. Similar to your intermediate layer, you should focus your testing on net-new columns in your marts layer. This might look like:

- Unit tests: validate especially complex transformation logic. For example:
    - Calculating dates in a way that feeds into forecasting.
    - Customer segmentation logic, especially logic that has a lot of CASE-WHEN statements.
- Primary key tests:** primarily where your mart's granularity has changed from its staging/intermediate inputs.
    - Similar to the intermediate models above, you may also want to add primary key tests to models whose grain hasn’t changed, but have been enriched with other data. Primary key tests here communicate your intent.
- Business focused anomaly tests: focus on *new* calculated fields, such as:
    - Singular tests on high-priority, high-impact tables where you have a specific problem you want forewarning about.
        - This might be something like fuzzy matching logic to detect when the same person is making multiple emails to extend a free trial beyond its acceptable end date.
    - A test for calculated numerical fields that shouldn’t vary by more than certain percentage in a week.
    - A calculated ledger table that follows certain business rules, i.e. today’s running total of spend must always be greater than yesterday’s.

### CI/CD

All of the testing you’ve applied in your different layers is the manual work of constructing your framework. CI/CD is where it gets automated. 

You should run a [slim CI](https://docs.getdbt.com/best-practices/best-practice-workflows#run-only-modified-models-to-test-changes-slim-ci) by default, unless there’s good reason to build everything in your project. 

With CI/CD and your regular production runs, your testing framework can be on autopilot. 😎

If and when you encounter failures, consult your trusty testing framework doc you built in our [earlier post.](https://docs.getdbt.com/blog/test-smarter-not-harder)

### Advanced CI

In the early stages of your smarter testing journey, start with dbt Cloud’s built-in flags for [advanced CI](https://www.notion.so/Test-Smarter-Where-should-tests-go-in-your-pipeline-128bb38ebda7803bb5c2e274c49b2599?pvs=21). In PRs with advanced CI enabled, dbt Cloud will flag what has been modified, added, or removed in the “compare changes” section. These three flags offer confidence and evidence that your changes are what you expect. Then, hand them off for peer review. Advanced CI helps jump start your colleague’s review of your work by bringing all of the implications of the change into one place. 

We consider usage of Advanced CI beyond the modified, added, or changed gut checks to be an advanced (heh) testing strategy, and look forward to hearing how you use it. 

## Wrapping it all up

Judicious data testing is like training for a marathon. It’s not productive to go run 20 miles a day and hope that you’ll be marathon-ready and uninjured. Similarly, throwing data tests randomly at your data pipeline without careful thought is not going to tell you much about your data quality. 

Runners go into marathons with training plans. Analytics engineers who care about data quality approach the issue with a plan, too. 

As you try out some of the guidance above here, remember that your testing needs are going to evolve over time. Don’t be afraid to revise your original testing strategy. 

Let us know your thoughts on these strategies in the comments section. Try them out, and share your thoughts to help us refine them.
