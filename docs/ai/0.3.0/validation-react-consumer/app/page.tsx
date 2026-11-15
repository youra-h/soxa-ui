import { Tabs } from '@soxa-ui/react'
import { Registration } from './registration'
export default function Page() {
	return (
		<main>
			<Registration />
			<Tabs
				aria_label="Workshop information"
				content={
					<>
						<Tabs.Content value="schedule">
							<p>The workshop starts at 10:00 UTC.</p>
						</Tabs.Content>
						<Tabs.Content value="venue">
							<p>Join us in the north training room.</p>
						</Tabs.Content>
					</>
				}
			>
				<Tabs.Item value="schedule" text="Schedule" active />
				<Tabs.Item value="venue" text="Venue" />
			</Tabs>
		</main>
	)
}
