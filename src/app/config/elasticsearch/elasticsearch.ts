import { Client } from "@elastic/elasticsearch";
import config from "..";

const apiKey = config.elasticsearch_api_key as string;
if (!apiKey) {
    throw new Error("ELASTICSEARCH_API_KEY environment variable is not set");
}

const esClient = new Client({
    node: config.elasticsearch_url as string,
    auth: { apiKey }
});

export default esClient;
