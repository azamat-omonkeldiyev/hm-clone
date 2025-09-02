import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env') })

export default {
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,
	elasticsearch_url: process.env.ELASTICSEARCH_URL,
	elasticsearch_api_key: process.env.ELASTICSEARCH_API_KEY,
}