import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export interface HitCounterProps {
    // the function for which we ant to count url hits
    downstream: lambda.IFunction;
}

export class HitCounter extends cdk.Construct {
    // allows accessing the counter function
    // creates a handler variable that cn only be accessed externally as readonly
    public readonly handler: lambda.Function;

    // the hit counter table
    public readonly table: dynamodb.Table;

    /*
        - Constructor is a method that is called when the class is created
        - Constructor arguments define the arguments of the HitCounter class
    */
    constructor(scope: cdk.Construct, id: string, props: HitCounterProps) {
        // initializes the base class and passes up the arguments recieved by the constructor
        // methods from the base class can be accessed via `super.Method()`, in this case not needed
        super(scope, id);

        const table = new dynamodb.Table(this, 'Hits', {
            partitionKey: {
                name: 'path',
                type: dynamodb.AttributeType.STRING
            }
        });

        this.table = table
    
        this.handler = new lambda.Function(this, 'HitCounterHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'hitcounter.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                // values that onlyt resolve when we deploy our stack.
                // "late-bound" values
                DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
                HITS_TABLE_NAME: table.tableName
            }
        });

        // grant the lambda role read/write permissions to our table
        table.grantReadWriteData(this.handler);

        // grant the lambda role invoke permissions to the downstream function
        props.downstream.grantInvoke(this.handler);
    }
}