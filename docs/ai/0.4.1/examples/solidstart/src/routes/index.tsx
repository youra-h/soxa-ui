import { A } from '@solidjs/router'
import Recipes from '../Recipes'
export default function Home() {
	return (
		<>
			<Recipes />
			<A href="/away">Leave recipes</A>
		</>
	)
}
