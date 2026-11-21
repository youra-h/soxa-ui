import { Tabs } from '@soxa-ui/react'
import { ClientForm } from './client-form'

export default function Page() {
	return (
		<>
			<ClientForm />
			<Tabs
				aria_label="Settings"
				content={
					<>
						<Tabs.Content value="general">General settings</Tabs.Content>
						<Tabs.Content value="privacy">Privacy settings</Tabs.Content>
					</>
				}
			>
				<Tabs.Item value="general" text="General" active />
				<Tabs.Item value="privacy" text="Privacy" />
			</Tabs>
		</>
	)
}
