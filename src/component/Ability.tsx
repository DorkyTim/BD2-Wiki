import { Loader, Stack, Flex, Image, Text, Slider } from '@mantine/core'
import { Suspense, lazy } from 'react'
import { type Characters } from '@/validation'
import {
	toLowerCaseReplaceSpaceAndHyphenRemoveSpecialChars,
	replaceVariablePlaceholders,
} from '@/utils'
import { useCharactersStore } from '@/stores'
import { THEME } from '@/theme'

// not type safe, point of failure
const abilities: Record<string, React.FC<{ character: Characters }>> = {
	Justia: lazy(() =>
		import('./AbilityJustia').then(res => ({
			default: res.AbilityJustia,
		}))
	),
}
const iconWidth = '3.5em'

const titles = {
	0: 'Beginner',
	1: 'Intermediate',
	2: 'Advanced',
	3: 'Expert',
	4: 'Legendary',
} as Record<string, string>

export const Ability = ({ character }: { character: Characters }) => {
	const upgrade = useCharactersStore(
		state => state.slider.ability[character.name] || 0
	)
	const Component = abilities[character.name]

	const marks = Object.values(character.ability.variables)[0] || []
	return (
		<Stack p="xs" pt="lg" pb="xl" align="center" gap="xl">
			<Stack w="100%" gap={0}>
				<Flex justify="start" w="100%" gap="xs">
					<Image
						src={`/icons/abilities/${toLowerCaseReplaceSpaceAndHyphenRemoveSpecialChars(character.name)}.png`}
						w={iconWidth}
					/>
					<Text ta="left" size="2em" fs="italic">
						{character.ability.name}
					</Text>
				</Flex>
				<Flex gap="xs" w="100%">
					<div style={{ width: iconWidth }} />
					<Text ta="left">
						{character.ability.type + ' ' + titles[upgrade]}
					</Text>
				</Flex>
			</Stack>
			<Text ta="left" size="1.5em">
				{`${replaceVariablePlaceholders(
					character.ability.description,
					character.ability.variables,
					upgrade
				)}`}
			</Text>

			<Slider
				value={upgrade}
				onChange={value => {
					useCharactersStore.setState(state => {
						state.slider.ability[character.name] = value
					})
				}}
				color="blue"
				min={0}
				max={marks.length - 1}
				step={1}
				w="auto"
				miw="20em"
				marks={Array.from({
					length: marks.length || 0,
				}).map((_, index) => {
					return {
						value: index,
						label: (
							<Flex>
								<Image src="/icons/abilities/pill.png" w={THEME.fontSizes.md} />
								<Text>{`${character.ability.costs[index]}`}</Text>
							</Flex>
						),
					}
				})}
				styles={{
					markLabel: {
						color: 'black',
						fontSize: THEME.fontSizes.xl,
						textAlign: 'center',
					},
				}}
			/>
			{Component ? (
				<Suspense fallback={<Loader />}>
					<Component character={character} />
				</Suspense>
			) : null}
		</Stack>
	)
}
