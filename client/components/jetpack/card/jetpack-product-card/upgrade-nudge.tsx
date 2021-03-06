/**
 * External dependencies
 */
import classNames from 'classnames';
import { useTranslate, TranslateResult } from 'i18n-calypso';
import { isFinite } from 'lodash';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { Button } from '@automattic/components';
import Gridicon from 'components/gridicon';
import { preventWidows } from 'lib/formatting';
import PlanPrice from 'my-sites/plan-price';
import { JETPACK_OFFER_RESET_UPGRADE_NUDGE_DISMISS } from 'my-sites/plans-v2/constants';
import { savePreference } from 'state/preferences/actions';
import { getPreference } from 'state/preferences/selectors';
import { DEFAULT_UPGRADE_NUDGE_FEATURES } from './fixtures';

/**
 * Type dependencies
 */
import type { SelectorProduct } from 'my-sites/plans-v2/types';
import type { ProductCardFeaturesItem } from './types';

type OwnProps = {
	billingTimeFrame: TranslateResult;
	className?: string;
	currencyCode: string;
	discountedPrice?: number;
	features?: ProductCardFeaturesItem[];
	onUpgradeClick: () => void;
	originalPrice: number;
	productType?: TranslateResult;
	selectorProduct: SelectorProduct;
};

const UpgradeNudge = ( {
	billingTimeFrame,
	className,
	currencyCode,
	discountedPrice,
	features = DEFAULT_UPGRADE_NUDGE_FEATURES,
	onUpgradeClick,
	originalPrice,
	selectorProduct,
	productType = 'Real-time',
}: OwnProps ) => {
	const translate = useTranslate();
	const isDiscounted = isFinite( discountedPrice );

	const storedPreference = useSelector( ( state ) =>
		getPreference( state, JETPACK_OFFER_RESET_UPGRADE_NUDGE_DISMISS )
	);

	const { description, productSlug } = selectorProduct;

	// Save dismiss to never show up the nudge again for this specific plan/product.
	const dispatch = useDispatch();
	const onCancelClick = useCallback( () => {
		dispatch(
			savePreference( JETPACK_OFFER_RESET_UPGRADE_NUDGE_DISMISS, {
				...storedPreference,
				[ productSlug ]: Date.now(),
			} )
		);
	}, [ dispatch, productSlug, storedPreference ] );

	// If this nudge was dismissed in the past don't show the nudge.
	if ( storedPreference && storedPreference[ productSlug ] ) {
		return null;
	}

	return (
		<div className={ classNames( 'jetpack-product-card__nudge', className ) }>
			<div className="jetpack-product-card__summary">
				<div className="jetpack-product-card__nudge-heading">
					<h3>
						{ translate( 'Upgrade to', {
							comment: 'to be accompanied with a product subtype such as "Real-time"',
						} ) }
						<br />
						<span className="jetpack-product-card__nudge-product-type">{ productType }</span>
					</h3>
				</div>
				<div className="jetpack-product-card__price">
					<span className="jetpack-product-card__raw-price">
						<PlanPrice
							rawPrice={ originalPrice }
							original={ isDiscounted }
							currencyCode={ currencyCode }
						/>
						{ isDiscounted && (
							<PlanPrice rawPrice={ discountedPrice } discounted currencyCode={ currencyCode } />
						) }
					</span>
					<span className="jetpack-product-card__billing-time-frame">{ billingTimeFrame }</span>
				</div>
			</div>
			<p className="jetpack-product-card__nudge-description">{ preventWidows( description ) }</p>

			<Button className="jetpack-product-card__nudge-button" primary onClick={ onUpgradeClick }>
				{ translate( 'Upgrade' ) }
			</Button>

			<ul className="jetpack-product-card__nudge-features">
				{ features.map( ( feature, index ) => (
					<li className="jetpack-product-card__nudge-feature" key={ index }>
						<Gridicon icon="checkmark" />
						<div className="jetpack-product-card__nudge-feature-desc">
							<strong>{ feature.text }</strong>
							<br />
							{ feature.description }
						</div>
					</li>
				) ) }
			</ul>

			<Button
				className="jetpack-product-card__nudge-button jetpack-product-card__nudge-button--cancel"
				borderless
				onClick={ onCancelClick }
			>
				{ translate( 'No thanks', {
					comment: 'label of a button that closes an upgrade nudge/promotion',
				} ) }
			</Button>
		</div>
	);
};

export default UpgradeNudge;
